import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, MapPin, Save, FileDown, Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import type { ServiceOrder, Material, Service } from '../types';
import { Customer } from "../types/customer";
import { useRouter } from 'next/router';

interface Service {
  service_id: string;
  price: string;
  description?: string;
}

export function ServiceOrderForm() {
  const { register, handleSubmit, watch, setValue, reset } = useForm<ServiceOrder>({
    defaultValues: {
      services: [{
        service_id: '',
        price: '',
        description: ''
      }]
    }
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{
    material: Material;
    quantity: number;
  }>>([]);
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicePrices, setServicePrices] = useState<any>({
    installation_prices: {},
    cleaning_prices: {}
  });
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadMaterials();
    loadServices();
    loadServicePrices();
  }, []);

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading materials:', error);
      toast.error('Erro ao carregar materiais');
      return;
    }

    setMaterials(data || []);
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    }
  };

  const loadServicePrices = async () => {
    try {
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        console.log('Preços carregados:', data);
        console.log('Preços de limpeza:', data.cleaning_prices);
        setServicePrices({
          installation_prices: data.installation_prices || {},
          cleaning_prices: data.cleaning_prices || {}
        });
      }
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    }
  };

  const handleLocation = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não suportada pelo navegador');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setValue('location_lat', latitude);
      setValue('location_lng', longitude);

      // Fazer a geocodificação reversa usando Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }

      const data = await response.json();
      const addressDetails = data.address;

      // Preencher os campos de endereço
      setAddress({
        street: addressDetails.road || addressDetails.street || '',
        number: addressDetails.house_number || '',
        complement: '',
        neighborhood: addressDetails.suburb || addressDetails.neighbourhood || '',
        city: addressDetails.city || addressDetails.town || addressDetails.municipality || '',
        state: addressDetails.state || '',
        zipCode: addressDetails.postcode || ''
      });

      toast.success('Localização capturada com sucesso!');
    } catch (error) {
      console.error('Erro ao capturar localização:', error);
      toast.error('Erro ao capturar localização. Por favor, insira o endereço manualmente.');
      setUseManualLocation(true);
    }
  };

  const addMaterial = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setSelectedMaterials(prev => [...prev, { material, quantity: 1 }]);
    }
  };

  const updateMaterialQuantity = (index: number, quantity: number) => {
    setSelectedMaterials(prev => {
      const newMaterials = [...prev];
      newMaterials[index] = { ...newMaterials[index], quantity: Math.max(1, quantity) };
      return newMaterials;
    });
  };

  const removeMaterial = (index: number) => {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const calculateTotal = () => {
    const materialsTotal = roundToTwo(calculateMaterialsTotal());
    const servicesTotal = roundToTwo(calculateServicesTotal());
    const subtotal = roundToTwo(materialsTotal + servicesTotal);
    return roundToTwo(subtotal - discount);
  };

  const calculateMaterialsTotal = () => {
    return roundToTwo(selectedMaterials.reduce((total, { material, quantity }) => {
      return total + (material.default_price * quantity);
    }, 0));
  };

  const calculateServicesTotal = () => {
    const services = watch('services') || [];
    return roundToTwo(services.reduce((total, service) => {
      const value = service.price ? parseFloat(service.price.toString().replace(',', '.')) : 0;
      return total + (isNaN(value) ? 0 : value);
    }, 0));
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    const numValue = parseFloat(value);
    setDiscount(isNaN(numValue) ? 0 : roundToTwo(numValue));
  };

  const resetForm = () => {
    reset({
      services: [{
        service_id: '',
        price: '',
        description: ''
      }]
    });
    setSelectedMaterials([]);
    setAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
  };

  const onSubmit = async (data: ServiceOrder) => {
    try {
      console.log('Dados do formulário:', data); // Debug

      // Primeiro cria o cliente se ele não existir
      let customerId = data.customer?.id;
      
      if (!customerId && data.customer?.name) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: data.customer.name,
            phone: data.customer.phone || ''
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      if (!customerId) {
        toast.error('Erro ao criar cliente');
        return;
      }

      // Calcula os valores totais
      const materialsTotal = calculateMaterialsTotal() || 0;
      const servicesTotal = calculateServicesTotal() || 0;
      const total = materialsTotal + servicesTotal - discount;

      // Salva a ordem de serviço
      const { data: newOrder, error: orderError } = await supabase
        .from('service_orders')
        .insert([{
          customer_id: customerId,
          status: 'pending',
          location_lat: data.location_lat || null,
          location_lng: data.location_lng || null,
          address: {
            street: address.street || '',
            number: address.number || '',
            complement: address.complement || '',
            neighborhood: address.neighborhood || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || ''
          },
          customer_phone: data.customer.phone || '',
          materials_amount: materialsTotal,
          services_amount: servicesTotal,
          discount_amount: discount,
          total_amount: total
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao criar ordem de serviço:', orderError);
        throw orderError;
      }

      console.log('Ordem de serviço criada:', newOrder); // Debug

      // Salva os serviços vinculados à ordem
      if (data.services?.length > 0) {
        const servicesData = data.services.map(service => ({
          service_order_id: newOrder.id,
          service_id: service.service_id,
          price: parseFloat(service.price?.toString().replace(',', '.') || '0'),
          description: service.description || ''
        }));

        console.log('Serviços a serem salvos:', servicesData); // Debug

        const { error: servicesError } = await supabase
          .from('order_services')
          .insert(servicesData);

        if (servicesError) {
          console.error('Erro ao salvar serviços:', servicesError);
          throw servicesError;
        }
      }

      // Salva os materiais selecionados
      if (selectedMaterials.length > 0) {
        const materialsData = selectedMaterials.map(({ material, quantity }) => ({
          service_order_id: newOrder.id,
          material_id: material.id,
          quantity: quantity,
          unit_price: material.default_price
        }));

        const { error: materialsError } = await supabase
          .from('service_order_materials')
          .insert(materialsData);

        if (materialsError) {
          console.error('Erro ao salvar materiais:', materialsError);
          throw materialsError;
        }
      }

      toast.success('Ordem de serviço criada com sucesso!');
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar ordem de serviço:', error);
      toast.error(`Erro ao criar ordem de serviço: ${error.message}`);
    }
  };

  const getCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('Error loading company info:', error);
      return {};
    }
  };

  const generatePDF = async (data: ServiceOrder, isNew = true) => {
    try {
      let orderData;

      if (isNew) {
        // Para nova OS, usa os dados do formulário
        orderData = {
          id: 'NOVA',
          customer: data.customer,
          services: data.services,
          address: address,
          materials: selectedMaterials.map(({ material, quantity }) => ({
            material,
            quantity,
            unit_price: material.default_price
          }))
        };
      } else {
        // Para OS existente, busca do banco
        const { data: existingOrder, error: orderError } = await supabase
          .from('service_orders')
          .select(`
            *,
            customer:customers(*),
            services:order_services(
              service_id,
              price,
              description,
              service:services(*)
            ),
            materials:service_order_materials(
              quantity,
              unit_price,
              material:materials(*)
            )
          `)
          .eq('id', data.id)
          .single();

        if (orderError) throw orderError;
        orderData = existingOrder;
      }

      // Busca informações da empresa
      const companyInfo = await getCompanyInfo();
      const currentDate = new Date().toLocaleDateString('pt-BR');

      console.log('Dados para PDF:', { orderData, companyInfo }); // Debug

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
            <h1 style="margin: 0;">Ordem de Serviço ${isNew ? '(NOVA)' : `#${orderData.id}`}</h1>
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
            ${orderData.services?.map((service: any) => `
              <div style="margin-bottom: 15px;">
                <p><strong>Serviço:</strong> ${service.service?.name || '-'}</p>
                <p><strong>Valor:</strong> R$ ${parseFloat(service.price || 0).toFixed(2)}</p>
                ${service.description ? `<p><strong>Descrição:</strong> ${service.description}</p>` : ''}
              </div>
            `).join('')}
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
                <td style="text-align: right;">R$ ${calculateServicesTotal().toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Materiais:</strong></td>
                <td style="text-align: right;">R$ ${calculateMaterialsTotal().toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Desconto:</strong></td>
                <td style="text-align: right;">R$ ${discount.toFixed(2)}</td>
              </tr>
              <tr style="font-size: 1.2em;">
                <td style="padding: 5px; border-top: 2px solid #000;"><strong>Total:</strong></td>
                <td style="text-align: right; border-top: 2px solid #000;">R$ ${calculateTotal().toFixed(2)}</td>
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
        filename: `OS_${isNew ? 'nova' : orderData.id}.pdf`,
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
    <form onSubmit={handleSubmit(onSubmit)} data-tour="service-order-form">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold mb-4" data-tour="customer-info">Informações do Cliente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" data-tour="customer-name">Nome do Cliente</label>
            <input
              type="text"
              {...register('customer.name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" data-tour="customer-phone">Telefone</label>
            <input
              type="tel"
              {...register('customer.phone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold" data-tour="services">Serviços</h2>
          <button
            type="button"
            onClick={() => {
              const newService = {
                service_id: '',
                price: '',
                description: ''
              };
              setValue('services', [...(watch('services') || []), newService]);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Serviço
          </button>
        </div>

        {(watch('services') || []).map((service, index) => (
          <div key={index} className="space-y-6 border-l-4 border-blue-200 pl-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium" data-tour="service-info">Serviço {index + 1}</h3>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const services = watch('services');
                    setValue(
                      'services',
                      services.filter((_, i) => i !== index)
                    );
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="service-type">Tipo de Serviço</label>
              <select
                {...register(`services.${index}.service_id`)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                onChange={(e) => {
                  const serviceId = e.target.value;
                  const selectedService = services.find(s => s.id === serviceId);
                  if (selectedService) {
                    setValue(`services.${index}.price`, selectedService.default_price.toString());
                  }
                }}
              >
                <option value="">Selecione o serviço</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="service-price">Valor do Serviço</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`services.${index}.price`)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="service-description">Descrição do Serviço</label>
              <textarea
                {...register(`services.${index}.description`)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold" data-tour="materials">Materiais Utilizados</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-4">
              <select
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                onChange={(e) => addMaterial(e.target.value)}
                value=""
              >
                <option value="">Selecione um material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} - R$ {material.default_price?.toFixed(2)} / {material.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterials.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                <span className="flex-1">{item.material.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => updateMaterialQuantity(index, Math.max(1, item.quantity - 1))}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateMaterialQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateMaterialQuantity(index, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="w-32 text-right">
                    R$ {(item.material.default_price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {(selectedMaterials.length > 0 || watch('services')?.length > 0) && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold" data-tour="budget-summary">Resumo do Orçamento</h3>
                <div className="space-y-2">
                  {selectedMaterials.length > 0 && (
                    <div className="flex justify-between">
                      <span>Total Materiais:</span>
                      <span>R$ {calculateMaterialsTotal().toFixed(2)}</span>
                    </div>
                  )}
                  {watch('services')?.length > 0 && (
                    <div className="flex justify-between">
                      <span>Total Serviços:</span>
                      <span>R$ {calculateServicesTotal().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span>Desconto:</span>
                      <div className="flex items-center space-x-2">
                        <span>R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={discount}
                          onChange={handleDiscountChange}
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total Final:</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold" data-tour="address">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="street">Rua</label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nome da rua"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="number">Número</label>
              <input
                type="text"
                value={address.number}
                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Número"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="complement">Complemento</label>
              <input
                type="text"
                value={address.complement}
                onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Apartamento, sala, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="neighborhood">Bairro</label>
              <input
                type="text"
                value={address.neighborhood}
                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="city">Cidade</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="state">Estado</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Estado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tour="zipCode">CEP</label>
              <input
                type="text"
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="CEP"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleLocation}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Capturar Localização GPS
            </button>
          </div>
        </div>

        {/* Preview do Orçamento */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" data-tour="budget-preview">Resumo do Orçamento</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Serviços:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculateServicesTotal())}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Materiais:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculateMaterialsTotal())}
              </span>
            </div>

            <div className="border-t border-gray-200 my-2"></div>

            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Salvar OS
          </button>
        </div>
      </div>
    </form>
  );
}