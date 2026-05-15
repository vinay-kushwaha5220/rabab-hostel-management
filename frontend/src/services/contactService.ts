import api from "./apiV2"

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  sendSms?: boolean
}

export interface ContactInfo {
  email: string
  phone: string
  address: string
  hours: {
    weekdays: string
    weekends: string
  }
  socialMedia: {
    facebook: string
    instagram: string
    twitter: string
  }
}

export interface ContactResponse {
  success: boolean
  message: string
  emailSent?: boolean
  smsSent?: boolean
}

export const contactService = {
  // Send contact message with optional SMS
  sendMessage: async (data: ContactFormData): Promise<ContactResponse> => {
    const response = await api.post("/contact/send", data)
    return response.data
  },

  // Get contact information
  getContactInfo: async (): Promise<ContactInfo> => {
    const response = await api.get("/contact/info")
    return response.data.data
  },
}
