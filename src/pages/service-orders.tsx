import { generatePDF } from '../utils/generatePDF';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';

export default function ServiceOrders() {
  const generatePDF = async (orderId: string) => {
    try {
      // Busca os dados completos da OS
      const { data: orderData, error: orderError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          materials:service_order_materials(
            quantity,
            unit_price,
            material:materials(*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Busca informações da empresa
      const { data: companyInfo } = await supabase
        .from('company_info')
        .select('*')
        .single();

      const currentDate = new Date().toLocaleDateString('pt-BR');

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <!-- Cabeçalho com Logo e Informações da Empresa -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
            ${companyInfo?.logo ? `<img src="${companyInfo.logo}" alt="Logo" style="max-height: 100px;"/>` : ''}
            <div style="text-align: right;">
              <h2 style="margin: 0;">${companyInfo?.name || 'Nome da Empresa'}</h2>
              <p style="margin: 5px 0;">CNPJ: ${companyInfo?.cnpj || '-'}</p>
              <p style="margin: 5px 0;">Tel: ${companyInfo?.phone || '-'}</p>
              <p style="margin: 5px 0;">Email: ${companyInfo?.email || '-'}</p>
            </div>
          </div>

          <!-- Número da OS e Data -->
          <div style="text-align: right; margin-bottom: 20px;">
            <h1 style="margin: 0;">Ordem de Serviço #${orderData.id}</h1>
            <p>Data: ${currentDate}</p>
          </div>

          <!-- Informações do Cliente -->
          <div style="margin-bottom: 30px;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Informações do Cliente</h3>
            <p><strong>Nome:</strong> ${orderData.customer?.name || '-'}</p>
            <p><strong>Telefone:</strong> ${orderData.customer?.phone || '-'}</p>
          </div>

          <!-- Endereço -->
          <div style="margin-bottom: 30px;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Endereço</h3>
            <p>${orderData.address?.street || '-'}, ${orderData.address?.number || '-'}</p>
            ${orderData.address?.complement ? `<p>Complemento: ${orderData.address.complement}</p>` : ''}
            <p>${orderData.address?.neighborhood || '-'}</p>
            <p>${orderData.address?.city || '-'} - ${orderData.address?.state || '-'}</p>
            <p>CEP: ${orderData.address?.zipCode || '-'}</p>
          </div>

          <!-- Serviços -->
          <div style="margin-bottom: 30px;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Serviços</h3>
            <div style="margin-bottom: 15px;">
              <p><strong>Tipo de Serviço:</strong> ${
                orderData.service_type === 'installation' ? 'Instalação' :
                orderData.service_type === 'maintenance' ? 'Manutenção' :
                orderData.service_type === 'cleaning' ? 'Limpeza' : 
                orderData.service_type === 'gas_recharge' ? 'Recarga de Gás' : '-'
              }</p>
              ${orderData.equipment_type ? `<p><strong>Tipo de Equipamento:</strong> ${orderData.equipment_type}</p>` : ''}
              ${orderData.equipment_power ? `<p><strong>Potência:</strong> ${orderData.equipment_power}</p>` : ''}
              ${orderData.description ? `<p><strong>Descrição:</strong> ${orderData.description}</p>` : ''}
            </div>
          </div>

          <!-- Materiais Utilizados -->
          ${orderData.materials?.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Materiais Utilizados</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Material</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Quantidade</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Valor Unit.</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.materials.map(({ material, quantity, unit_price }) => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd;">${material?.name || '-'}</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${quantity || 0} ${material?.unit || '-'}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">R$ ${(unit_price || 0).toFixed(2)}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">R$ ${((unit_price || 0) * (quantity || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p>Nenhum material utilizado</p>'}

          <!-- Resumo Financeiro -->
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Resumo do Orçamento</h3>
            <table style="width: 100%; margin-top: 10px;">
              <tr>
                <td style="padding: 5px;"><strong>Serviços:</strong></td>
                <td style="text-align: right;">R$ ${(orderData.services_amount || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Materiais:</strong></td>
                <td style="text-align: right;">R$ ${(orderData.materials_amount || 0).toFixed(2)}</td>
              </tr>
              <tr style="font-size: 1.2em;">
                <td style="padding: 5px; border-top: 2px solid #000;"><strong>Total:</strong></td>
                <td style="text-align: right; border-top: 2px solid #000;">R$ ${(orderData.total_amount || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Assinaturas -->
          <div style="margin-top: 50px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; margin-top: 100px;">
              <div style="width: 45%; text-align: center;">
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                  ${companyInfo?.name || 'Nome da Empresa'}<br>
                  CNPJ: ${companyInfo?.cnpj || '-'}
                </div>
              </div>
              <div style="width: 45%; text-align: center;">
                <div style="border-top: 1px solid #000; padding-top: 5px;">
                  ${orderData.customer?.name || 'Nome do Cliente'}<br>
                  Cliente
                </div>
              </div>
            </div>
            <p style="margin-top: 20px; font-size: 0.8em; text-align: center; color: #666;">
              Este documento pode ser assinado digitalmente através do GOV.BR ou fisicamente.<br>
              Data: ${currentDate}
            </p>
          </div>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `OS_${orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link
          href="/service-orders/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nova OS
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serviço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.customer?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.service_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => generatePDF(order.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Gerar Orçamento
                  </button>
                  <Link
                    href={`/service-orders/${order.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 