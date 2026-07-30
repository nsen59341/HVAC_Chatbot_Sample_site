import { Conversation } from '../types';

export const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-101',
    customer_id: 'CUST-1001',
    visitor_id: 'vis-1001',
    started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'Active',
    transcript: [
      { role: 'assistant', text: 'Hi there! 👋\nMy name is Nathan. How can I assist you with King HVAC Services today?' },
      { role: 'user', text: 'Hi, I need an urgent AC servicing and filter replacement in South Delhi.' },
      { role: 'assistant', text: 'I can certainly help you book an AC Service appointment. Our senior technician Rajesh Kumar is available today at 4:00 PM IST.' },
      { role: 'user', text: 'That timing works great for me. Please confirm the booking.' },
      { role: 'assistant', text: 'Great! Your appointment has been scheduled for today at 4:00 PM. Technician Rajesh Kumar has been assigned.' }
    ]
  },
  {
    id: 'conv-102',
    customer_id: 'CUST-1001',
    visitor_id: 'vis-1001',
    started_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'Completed',
    transcript: [
      { role: 'assistant', text: 'Hi there! 👋\nMy name is Nathan. How can I assist you with King HVAC Services today?' },
      { role: 'user', text: 'What are your rates for split AC coil cleaning and gas top-up?' },
      { role: 'assistant', text: 'Our split AC coil deep cleaning starts at ₹1,499 and gas top-up starts at ₹1,999 with 30 days service warranty.' },
      { role: 'user', text: 'Okay thanks! I will check with my family and book later.' }
    ]
  },
  {
    id: 'conv-103',
    customer_id: 'CUST-1002',
    visitor_id: 'vis-1002',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'Completed',
    transcript: [
      { role: 'assistant', text: 'Hi there! 👋\nMy name is Nathan. How can I assist you with King HVAC Services today?' },
      { role: 'user', text: 'Hello, our central heat pump is making a loud buzzing noise.' },
      { role: 'assistant', text: 'A buzzing noise can indicate a faulty motor capacitor or fan obstruction. We recommend an urgent diagnostic inspection.' },
      { role: 'user', text: 'Can technician Priya Menon visit tomorrow morning?' },
      { role: 'assistant', text: 'Yes! Technician Priya Menon is scheduled for tomorrow at 10:30 AM IST. You will receive an SMS confirmation shortly.' }
    ]
  },
  {
    id: 'conv-104',
    customer_id: 'CUST-1003',
    visitor_id: 'vis-1003',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'Resolved',
    transcript: [
      { role: 'assistant', text: 'Hi there! 👋\nMy name is Nathan. How can I assist you with King HVAC Services today?' },
      { role: 'user', text: 'Do you provide ductwork antimicrobial sanitization for residential apartments?' },
      { role: 'assistant', text: 'Yes, we provide hospital-grade HEPA & UV duct sanitization for apartments and commercial spaces.' },
      { role: 'user', text: 'Perfect. Thanks for the quick response!' }
    ]
  },
  {
    id: 'conv-105',
    customer_id: 'CUST-1004',
    visitor_id: 'vis-1004',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'Completed',
    transcript: [
      { role: 'assistant', text: 'Hi there! 👋\nMy name is Nathan. How can I assist you with King HVAC Services today?' },
      { role: 'user', text: 'Water is leaking from our indoor AC unit onto the living room wooden floor.' },
      { role: 'assistant', text: 'Please turn off the AC unit immediately to prevent water damage. I am flagging your address for priority emergency repair.' },
      { role: 'user', text: 'Thank you Nathan! Sending technician details to my phone now.' }
    ]
  }
];
