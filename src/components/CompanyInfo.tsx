import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CompanyInformation } from '../types';

export function CompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInformation>({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    logo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const path = `company/logo_${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company')
        .getPublicUrl(path);

      setCompanyInfo(prev => ({ ...prev, logo: publicUrl }));
      await saveCompanyInfo({ ...companyInfo, logo: publicUrl });
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo');
    }
  };

  const saveCompanyInfo = async (info = companyInfo) => {
    try {
      const { error } = await supabase
        .from('company_info')
        .upsert([info]);

      if (error) throw error;

      toast.success('Informações da empresa salvas com sucesso!');
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Erro ao salvar informações da empresa');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Informações da Empresa</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
          <input
            type="text"
            value={companyInfo.name}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Nome da empresa"
            data-tour="company-name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">CNPJ</label>
          <input
            type="text"
            value={companyInfo.cnpj}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, cnpj: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="00.000.000/0000-00"
            data-tour="company-cnpj"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="text"
            value={companyInfo.phone}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="(00) 00000-0000"
            data-tour="company-phone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            value={companyInfo.email}
            onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="exemplo@empresa.com"
            data-tour="company-email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Empresa</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
              data-tour="company-logo"
            />
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-5 w-5 mr-2" />
              Escolher Logo
            </label>
            {companyInfo.logo && (
              <img
                src={companyInfo.logo}
                alt="Logo da empresa"
                className="h-16 w-16 object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => saveCompanyInfo()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Informações
          </button>
        </div>
      </div>
    </div>
  );
}