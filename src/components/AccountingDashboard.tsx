import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Wrench } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { ServiceOrder } from '../types';

export function AccountingDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    profit: 0,
    serviceCount: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth]);

  const loadMonthlyData = async () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    try {
      // Primeiro busca as ordens de serviço
      const { data: orders, error: ordersError } = await supabase
        .from('service_orders')
        .select(`
          *,
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
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        return;
      }

      // Depois busca os materiais para essas ordens
      const orderIds = orders?.map(order => order.id) || [];
      const { data: orderMaterials, error: materialsError } = await supabase
        .from('service_order_materials')
        .select('*')
        .in('service_order_id', orderIds);

      if (materialsError) {
        console.error('Error loading materials:', materialsError);
        return;
      }

      // Se tiver materiais, busca os detalhes de cada material
      let materialsDetails = [];
      if (orderMaterials && orderMaterials.length > 0) {
        const materialIds = [...new Set(orderMaterials.map(m => m.material_id))];
        const { data: materialsData, error: materialsDetailsError } = await supabase
          .from('materials')
          .select('*')
          .in('id', materialIds);

        if (materialsDetailsError) {
          console.error('Error loading materials details:', materialsDetailsError);
          return;
        }

        // Combina os dados dos materiais
        materialsDetails = orderMaterials.map(orderMaterial => {
          const materialDetail = materialsData?.find(m => m.id === orderMaterial.material_id);
          return {
            ...orderMaterial,
            material: materialDetail
          };
        });
      }

      // Processa os dados
      const breakdown: Record<string, number> = {};
      let totalRevenue = 0;
      let totalCosts = 0;

      console.group('=== DEBUG RELATÓRIO FINANCEIRO ===');
      console.log('Ordens encontradas:', orders?.length);
      
      orders?.forEach((order: any) => {
        console.group(`Ordem ${order.id}`);
        console.log('Status:', order.status);
        console.log('Valor total:', order.total_amount);
        console.log('Quantidade de serviços:', order.services?.length);
        
        // Soma o valor total do serviço
        const servicePrice = order.total_amount || 0;
        totalRevenue += servicePrice;

        // Calcula o custo dos materiais desta ordem
        const orderMaterialsList = materialsDetails.filter(m => m.service_order_id === order.id);
        const materialsCost = orderMaterialsList.reduce((acc, mat) => {
          return acc + (mat.quantity * mat.unit_price);
        }, 0);
        totalCosts += materialsCost;

        // Atualiza o breakdown por tipo de serviço
        if (order.services && Array.isArray(order.services)) {
          order.services.forEach((serviceOrder: any) => {
            console.group(`Serviço ${serviceOrder.id}`);
            console.log('Nome:', serviceOrder.service?.name);
            console.log('Preço:', serviceOrder.price);
            
            const serviceName = serviceOrder.service?.name;
            if (serviceName) {
              if (!breakdown[serviceName]) {
                breakdown[serviceName] = 0;
              }
              const servicePrice = Number(serviceOrder.price) || 0;
              breakdown[serviceName] += servicePrice;
              console.log(`Total acumulado para ${serviceName}: ${breakdown[serviceName]}`);
            } else {
              console.warn('Serviço sem nome!');
            }
            console.groupEnd();
          });
        }
        console.groupEnd();
      });

      console.log('=== RESUMO ===');
      console.log('Breakdown por serviço:', breakdown);
      console.log('Receita total:', totalRevenue);
      console.log('Custos totais:', totalCosts);
      console.groupEnd();

      // Ordena o breakdown por valor (maior para menor)
      const sortedBreakdown: Record<string, number> = {};
      Object.entries(breakdown)
        .sort(([, a], [, b]) => b - a)
        .forEach(([key, value]) => {
          sortedBreakdown[key] = value;
        });

      setSummary({
        totalRevenue,
        totalCosts,
        profit: totalRevenue - totalCosts,
        serviceCount: orders?.length || 0,
      });

      setServiceBreakdown(sortedBreakdown);
    } catch (error) {
      console.error('Error processing accounting data:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow" data-tour="dashboard-header">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Relatório Financeiro</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            className="bg-blue-50 p-4 rounded-lg"
            data-tour="monthly-revenue"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div 
            className="bg-red-50 p-4 rounded-lg"
            data-tour="monthly-costs"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Custos Totais</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCosts)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div 
            className="bg-green-50 p-4 rounded-lg"
            data-tour="monthly-profit"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lucro</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.profit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div 
            className="bg-purple-50 p-4 rounded-lg"
            data-tour="monthly-service-count"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Serviços</p>
                <p className="text-2xl font-bold text-purple-600">{summary.serviceCount}</p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow" data-tour="service-breakdown">
        <h3 className="text-lg font-semibold mb-4">Receita por Tipo de Serviço</h3>
        <div className="space-y-4">
          {Object.entries(serviceBreakdown).map(([type, value]) => (
            <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">
                {type}
              </span>
              <span className="text-gray-900 font-semibold">{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}