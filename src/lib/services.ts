import { Service } from "../types/order.types";

export const SERVICES_CATALOG: Service[] = [
  { 
    id: 'w0', 
    code: 'W0', 
    name: 'Rửa Gầm Thường', 
    type: 'package', 
    price: 100000, 
    description: 'Rửa nước gầm xe và xịt lốp nhanh chóng.', 
    createdAt: '',
    colorType: 'normal',
    duration: 15,
    tags: ['Nhanh chóng', 'Giá rẻ']
  },
  { 
    id: 'w1', 
    code: 'W1', 
    name: 'Rửa Xe Phổ Thông', 
    type: 'package', 
    price: 150000, 
    description: 'Rửa bọt tuyết, hút bụi cơ bản, lau kính, làm sạch lốp.', 
    createdAt: '',
    label: 'Best seller',
    colorType: 'primary',
    duration: 30,
    tags: ['Phổ biến', 'Đầy đủ']
  },
  { 
    id: 'w2', 
    code: 'W2', 
    name: 'Rửa Xe Cao Cấp', 
    type: 'package', 
    price: 250000, 
    description: 'Rửa chi tiết bọt tuyết mịn, hút bụi chuyên sâu, dưỡng nhựa nội thất, xịt gầm sạch sâu.', 
    createdAt: '',
    colorType: 'normal',
    duration: 45,
    tags: ['Chuyên sâu', 'Dưỡng nhựa']
  },
  { 
    id: 'w3', 
    code: 'W3', 
    name: 'Rửa Chuyên Sâu & Xịt Dưỡng Gầm', 
    type: 'package', 
    price: 450000, 
    description: 'Quy trình rửa tỉ mỉ, tháo bánh tẩy bùn đất, phủ gầm bảo vệ kim loại chống rỉ sét.', 
    createdAt: '',
    colorType: 'normal',
    duration: 60,
    tags: ['Gầm xe', 'Bảo vệ rỉ sét']
  },
  { 
    id: 'w4', 
    code: 'W4', 
    name: 'Detailing Nội Thất', 
    type: 'package', 
    price: 1200000, 
    description: 'Dọn sạch khoang nội thất, xông hơi diệt khuẩn, làm sạch da lộn, dưỡng bóng ghế da cao cấp.', 
    createdAt: '',
    colorType: 'gold',
    duration: 120,
    tags: ['Diệt khuẩn', 'Dưỡng ghế da', 'Premium']
  },
  { 
    id: 'w5', 
    code: 'W5', 
    name: 'Detailing Khoang Máy', 
    type: 'package', 
    price: 3500000, 
    description: 'Vệ sinh khoang máy bằng hơi nước nóng, phủ dưỡng bóng block máy, phủ nano tản nhiệt.', 
    createdAt: '',
    colorType: 'gold',
    duration: 180,
    tags: ['Khoang máy', 'Nano tản nhiệt', 'Luxury']
  },
];

export const ADDONS_CATALOG: Service[] = [
  { 
    id: 'add01', 
    code: 'ADD01', 
    name: 'Phủ Rain Repellent kính lái', 
    type: 'addon', 
    price: 50000, 
    description: 'Hiệu ứng lá sen chống bám nước kính lái khi trời mưa lớn.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Kính lái', 'Lá sen'],
    duration: 10
  },
  { 
    id: 'add02', 
    code: 'ADD02', 
    name: 'Khử mùi sinh học ion bạc', 
    type: 'addon', 
    price: 80000, 
    description: 'Xông tinh dầu bạc hà diệt khuẩn nấm mốc máy lạnh.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Khử mùi', 'Bạc hà'],
    duration: 15
  },
];
