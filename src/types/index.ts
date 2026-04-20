export type VehicleType = 'company' | 'personal'
export type VehicleStatus = 'active' | 'warning' | 'expired'

export interface Company {
  id: string
  name: string
  plan_type: 'small' | 'standard'
  created_at: string
}

export interface Employee {
  id: string
  company_id: string
  name: string
  line_user_id: string | null
  license_expiry: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  company_id: string
  employee_id: string
  vehicle_type: VehicleType
  license_plate: string
  inspection_expiry: string
  compulsory_insurance_expiry: string
  voluntary_insurance_expiry: string | null
  status: VehicleStatus
  image_url: string | null
  created_at: string
  updated_at: string
  employee?: Employee
}
