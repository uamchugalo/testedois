export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  default_price: number;
  is_custom: boolean;
}

export interface ServiceOrderMaterial {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  material?: Material;
}

export interface ServiceOrderPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'during' | 'after';
}

export interface Service {
  id: string;
  name: string;
  default_price: number;
}

export interface ServiceOrderItem {
  service_id: string;
  name: string;
  price: number;
  description?: string;
}

export interface ServiceOrder {
  id?: string;
  customer_id?: string;
  customer?: Customer;
  services: ServiceOrderItem[];
  include_photos: boolean;
  location_lat?: number;
  location_lng?: number;
  status: 'pending' | 'in_progress' | 'completed';
  total_amount: number;
  photos?: string[];
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface CompanyInformation {
  id?: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  logo?: string;
}

export interface ServicePrices {
  installation_prices: {
    [key: string]: {
      [btus: string]: string;
    };
  };
  cleaning_prices: {
    [key: string]: string;
  };
}