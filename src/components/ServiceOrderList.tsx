import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { FileText, CheckCircle, Clock, FileDown, Upload, Trash2 } from 'lucide-react';
import type { ServiceOrder } from '../types';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

export function ServiceOrderList() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          services:order_services(
            id,
            service_id,
            price,
            description,
            service:services(
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleSignedOrderUpload = async (orderId: string, file: File) => {
    try {
      // Upload do arquivo
      const filename = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('service_orders')
        .upload(`orders/${filename}`, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Pegar a URL pública
      const { data } = await supabase.storage
        .from('service_orders')
        .getPublicUrl(`orders/${filename}`);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Atualizar a ordem de serviço
      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ signed_order_url: data.publicUrl })
        .eq('id', orderId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast.success('Ordem de serviço assinada enviada com sucesso!');
      loadOrders();
    } catch (error: any) {
      console.error('Error uploading signed order:', error);
      toast.error(error.message || 'Erro ao enviar ordem de serviço assinada');
    }
  };

  const generatePDF = async (order: ServiceOrder) => {
    try {
      // Buscar os serviços relacionados a esta OS
      const { data: services, error: servicesError } = await supabase
        .from('order_services')
        .select(`
          id,
          service_order_id,
          service_id,
          description,
          price,
          service:services(
            id,
            name,
            description,
            default_price
          )
        `)
        .eq('service_order_id', order.id);

      if (servicesError) throw servicesError;

      // Buscar os materiais relacionados a esta OS
      const { data: orderMaterials, error: materialsError } = await supabase
        .from('service_order_materials')
        .select('*')
        .eq('service_order_id', order.id);

      if (materialsError) throw materialsError;

      // Se tiver materiais, busca os detalhes de cada material
      let materials = [];
      if (orderMaterials && orderMaterials.length > 0) {
        const materialIds = orderMaterials.map(m => m.material_id);
        const { data: materialsData, error: materialsDetailsError } = await supabase
          .from('materials')
          .select('*')
          .in('id', materialIds);

        if (materialsDetailsError) throw materialsDetailsError;

        // Combina os dados
        materials = orderMaterials.map(orderMaterial => {
          const materialDetails = materialsData?.find(m => m.id === orderMaterial.material_id);
          return {
            quantity: orderMaterial.quantity,
            unit_price: orderMaterial.unit_price,
            material: materialDetails
          };
        });
      }

      // Debug
      console.log('Materials data:', { orderMaterials, materials });

      // Busca informações da empresa
      const companyInfo = await getCompanyInfo();

      const element = document.createElement('div');
      
      // Converter a URL da logo em uma imagem base64 para garantir que seja incluída no PDF
      let logoBase64 = '';
      if (companyInfo?.logo) {
        try {
          const response = await fetch(companyInfo.logo);
          const blob = await response.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting logo to base64:', error);
        }
      }

      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <!-- Cabeçalho com Logo e Informações da Empresa -->
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
            <div style="text-align: left;">
              <h2 style="margin: 0; font-size: 24px;">${companyInfo?.company_name || ''}</h2>
              <p style="margin: 5px 0;">CNPJ: ${companyInfo?.cnpj || ''}</p>
              <p style="margin: 5px 0;">Tel: ${companyInfo?.phone || ''}</p>
              <p style="margin: 5px 0;">Email: ${companyInfo?.email || ''}</p>
            </div>
            ${logoBase64 ? `
              <div style="text-align: right;">
                <img src="${logoBase64}" alt="Logo" style="max-height: 120px; max-width: 200px; object-fit: contain;"/>
              </div>
            ` : ''}
          </div>

          <!-- Informações do Cliente -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Informações do Cliente</h3>
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${order.customer?.name || ''}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${order.customer?.phone || ''}</p>
            <p style="margin: 5px 0;"><strong>Endereço:</strong> ${order.address?.street ? `${order.address.street}, ${order.address.number}` : ''}</p>
            ${order.address?.complement ? `<p style="margin: 5px 0;"><strong>Complemento:</strong> ${order.address.complement}</p>` : ''}
            <p style="margin: 5px 0;">${order.address?.neighborhood || ''} - ${order.address?.city || ''} - ${order.address?.state || ''}</p>
            ${order.address?.zipCode ? `<p style="margin: 5px 0;"><strong>CEP:</strong> ${order.address.zipCode}</p>` : ''}
          </div>

          <!-- Serviços Realizados -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Serviços Realizados</h3>
            ${services?.map((service, index) => `
              <div style="margin-left: 20px; margin-bottom: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0;">Serviço ${index + 1}</h4>
                <p style="margin: 5px 0;"><strong>Serviço:</strong> ${service.service?.name || '-'}</p>
                <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${parseFloat(service.price || 0).toFixed(2)}</p>
                ${service.description ? `<p style="margin: 5px 0;"><strong>Descrição:</strong> ${service.description}</p>` : ''}
              </div>
            `).join('')}
          </div>

          <!-- Materiais Utilizados -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Materiais Utilizados</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Material</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">Qtd.</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Valor Unit.</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${materials?.map(item => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.material.name}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">R$ ${item.unit_price.toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">R$ ${(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Valor Total -->
          <div style="margin-bottom: 30px; text-align: right;">
            <table style="width: 300px; margin-left: auto;">
              <tr>
                <td style="padding: 8px;"><strong>Valor dos Materiais:</strong></td>
                <td style="padding: 8px; text-align: right;">R$ ${order.materials_amount?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Valor do Serviço:</strong></td>
                <td style="padding: 8px; text-align: right;">R$ ${order.services_amount?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Desconto:</strong></td>
                <td style="padding: 8px; text-align: right; color: #047857;">- R$ ${order.discount_amount?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 1.1em;">
                <td style="padding: 8px; border-top: 2px solid #000;"><strong>Total Final:</strong></td>
                <td style="padding: 8px; text-align: right; border-top: 2px solid #000;">R$ ${order.total_amount?.toFixed(2) || '0.00'}</td>
              </tr>
            </table>
          </div>

          <!-- Assinaturas -->
          <div style="margin-top: 50px;">
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 45%; text-align: center;">
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                  <p style="margin: 0;">Cliente</p>
                  <p style="margin: 5px 0; font-size: 12px;">${order.customer?.name || ''}</p>
                </div>
              </div>
              <div style="width: 45%; text-align: center;">
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                  <p style="margin: 0;">${companyInfo?.company_name || ''}</p>
                  <p style="margin: 5px 0; font-size: 12px;">CNPJ: ${companyInfo?.cnpj || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `orcamento_${order.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error) throw error;

      console.log('Company Info Raw Data:', data);

      const companyInfo = {
        company_name: data?.name || '',
        cnpj: data?.cnpj || '',
        phone: data?.phone || '',
        email: data?.email || '',
        logo: data?.logo || ''
      };

      console.log('Company Info Mapped:', companyInfo);
      return companyInfo;
    } catch (error) {
      console.error('Error loading company info:', error);
      return null;
    }
  };

  const handleDelete = async (orderId: string) => {
    const isConfirmed = window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço? Esta ação não pode ser desfeita.');
    
    if (!isConfirmed) return;

    try {
      const { error: materialsError } = await supabase
        .from('service_order_materials')
        .delete()
        .eq('service_order_id', orderId);

      if (materialsError) throw materialsError;

      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Ordem de serviço excluída com sucesso!');
      
      loadOrders();
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      toast.error('Erro ao excluir ordem de serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{order.customer?.name || 'Cliente não especificado'}</h3>
              <p className="text-sm text-gray-600">Serviço: {order.services?.[0]?.service?.name || '-'}</p>
              <p className="text-sm text-gray-600">Data: {format(new Date(order.created_at || ''), 'dd/MM/yyyy HH:mm')}</p>
              <p className="text-sm text-gray-600">Valor Total: R$ {order.total_amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status === 'completed' ? 'Concluído' :
                 order.status === 'in_progress' ? 'Em Andamento' : 'Orçamento'}
              </span>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as 'pending' | 'in_progress' | 'completed')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="pending">Orçamento</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{order.description}</p>
          </div>
          {order.total_amount && (
            <div className="mt-2 text-sm font-medium text-gray-900">
              Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => generatePDF(order)}
                className="inline-flex items-center px-4 py-2 border border-blue-500 shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                <FileDown className="h-5 w-5 mr-2" />
                Gerar OS
              </button>

              <button
                onClick={() => handleDelete(order.id)}
                className="text-red-600 hover:text-red-900 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </button>
            </div>

            <div className="flex items-center gap-2">
              {order.signed_order_url ? (
                <>
                  <a
                    href={order.signed_order_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-green-500 shadow-sm text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    <FileDown className="h-5 w-5 mr-2" />
                    Baixar OS Assinada
                  </a>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && window.confirm('Esta OS já possui uma assinatura. Deseja substituí-la?')) {
                          handleSignedOrderUpload(order.id, file);
                        }
                      }}
                      className="hidden"
                      id={`signed-order-update-${order.id}`}
                    />
                    <label
                      htmlFor={`signed-order-update-${order.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Atualizar OS Assinada
                    </label>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSignedOrderUpload(order.id, file);
                    }}
                    className="hidden"
                    id={`signed-order-upload-${order.id}`}
                  />
                  <label
                    htmlFor={`signed-order-upload-${order.id}`}
                    className="inline-flex items-center px-4 py-2 border border-blue-500 shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Enviar OS Assinada
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}