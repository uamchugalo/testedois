import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Material } from '../types';

export interface Service {
  id: string;
  name: string;
  default_price: number;
}

interface ServiceOrderFormProps {
  services: Service[];
  addService: (name: string, price: number) => void;
}

export function MaterialsManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    unit: '',
    default_price: '',
  });
  const [newService, setNewService] = useState({
    name: '',
    default_price: '',
  });

  useEffect(() => {
    loadMaterials();
    loadServices();
  }, []);

  // Funções de carregamento
  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Erro ao carregar materiais');
      return;
    }

    setMaterials(data || []);
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading services:', error);
      toast.error('Erro ao carregar serviços');
      return;
    }

    setServices(data || []);
  };

  // Funções de adição
  const handleAddMaterial = async () => {
    try {
      if (!newMaterial.name || !newMaterial.unit || !newMaterial.default_price) {
        toast.error('Preencha todos os campos do material');
        return;
      }

      const { data, error } = await supabase
        .from('materials')
        .insert([{
          name: newMaterial.name,
          unit: newMaterial.unit,
          default_price: parseFloat(newMaterial.default_price),
          is_custom: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setMaterials([...materials, data]);
      setNewMaterial({ name: '', unit: '', default_price: '' });
      toast.success('Material adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar material');
    }
  };

  const addService = async (name: string, price: number) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ name, default_price: price }])
        .select()
        .single();

      if (error) {
        console.error('Error adding service:', error);
        toast.error('Erro ao adicionar serviço');
        return;
      }

      setServices([...services, data]);
      toast.success('Serviço adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar serviço');
    }
  };

  const handleAddService = async () => {
    try {
      if (!newService.name || !newService.default_price) {
        toast.error('Preencha todos os campos do serviço');
        return;
      }

      await addService(newService.name, parseFloat(newService.default_price));
      setNewService({ name: '', default_price: '' });
    } catch (error) {
      toast.error('Erro ao adicionar serviço');
    }
  };

  // Funções de atualização
  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMaterials(materials.map(m => m.id === id ? { ...m, ...updates } : m));
      toast.success('Material atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar material');
    }
  };

  const handleUpdateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Serviço atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar serviço');
    }
  };

  // Funções de exclusão
  const handleDeleteMaterial = async (id: string) => {
    try {
      // Primeiro remove todas as referências nas ordens de serviço
      const { error: deleteRefsError } = await supabase
        .from('service_order_materials')
        .delete()
        .eq('material_id', id);

      if (deleteRefsError) throw deleteRefsError;

      // Depois remove o material
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMaterials(materials.filter(m => m.id !== id));
      toast.success('Material removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover material:', error);
      toast.error('Erro ao remover material');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      // Primeiro remove todas as referências nas ordens de serviço
      const { error: deleteRefsError } = await supabase
        .from('order_services')
        .delete()
        .eq('service_id', id);

      if (deleteRefsError) throw deleteRefsError;

      // Depois remove o serviço
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(services.filter(s => s.id !== id));
      toast.success('Serviço removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast.error('Erro ao remover serviço');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Seção de Serviços */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8" data-tour="add-service">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciamento de Serviços</h2>
          
          {/* Formulário de adição de serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <label htmlFor="service-name" className="text-sm font-medium text-gray-700 mb-1">
                Nome do Serviço
              </label>
              <input
                id="service-name"
                type="text"
                placeholder="Ex: Instalação Split 9000 BTUs"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="service-price" className="text-sm font-medium text-gray-700 mb-1">
                Preço Padrão (R$)
              </label>
              <input
                id="service-price"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newService.default_price}
                onChange={(e) => setNewService({ ...newService, default_price: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddService}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Serviço
            </button>
          </div>

          {/* Tabela de serviços */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Preço Padrão</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {services.map((service) => (
                  <tr key={service.id} data-tour="service-item">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3">
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={service.name}
                        onChange={(e) => handleUpdateService(service.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">R$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border-0 py-1.5 pl-8 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          value={service.default_price}
                          onChange={(e) => handleUpdateService(service.id, { default_price: parseFloat(e.target.value) })}
                        />
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seção de Materiais */}
        <div className="bg-white rounded-lg shadow-lg p-6" data-tour="add-material">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciamento de Materiais</h2>
          
          {/* Formulário de adição de material */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col">
              <label htmlFor="material-name" className="text-sm font-medium text-gray-700 mb-1">
                Nome do Material
              </label>
              <input
                id="material-name"
                type="text"
                placeholder="Ex: Tubo de Cobre"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="material-unit" className="text-sm font-medium text-gray-700 mb-1">
                Unidade
              </label>
              <input
                id="material-unit"
                type="text"
                placeholder="Ex: metro"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="material-price" className="text-sm font-medium text-gray-700 mb-1">
                Preço Padrão (R$)
              </label>
              <input
                id="material-price"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newMaterial.default_price}
                onChange={(e) => setNewMaterial({ ...newMaterial, default_price: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddMaterial}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Material
            </button>
          </div>

          {/* Tabela de materiais */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unidade</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Preço Padrão</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {materials.map((material) => (
                  <tr key={material.id} data-tour="material-item">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3">
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={material.name}
                        onChange={(e) => handleUpdateMaterial(material.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={material.unit}
                        onChange={(e) => handleUpdateMaterial(material.id, { unit: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">R$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border-0 py-1.5 pl-8 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          value={material.default_price}
                          onChange={(e) => handleUpdateMaterial(material.id, { default_price: parseFloat(e.target.value) })}
                        />
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}