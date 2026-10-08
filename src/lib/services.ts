import { Service } from "../types/order.types";

export const SERVICES_CATALOG: Service[] = [
  { 
    id: 'w0', 
    code: 'W0', 
    name: 'Express', 
    type: 'package', 
    price: 59000, 
    description: 'Rửa nhanh tự động bằng máy rửa WashNOW (ngoại thất) • Xịt gầm • Sấy khô contour tốc độ cao.', 
    createdAt: '',
    colorType: 'normal',
    duration: 15,
    tags: ['Tự động', 'Nhanh 10-15p']
  },
  { 
    id: 'w1', 
    code: 'W1', 
    name: 'Basic Clean', 
    type: 'package', 
    price: 159000, 
    description: 'Rửa nhanh tự động • Xịt gầm áp lực cao • Hút bụi cơ bản • Lau kính nội thất sạch bóng.', 
    createdAt: '',
    label: 'Best seller',
    colorType: 'primary',
    duration: 25,
    tags: ['Khuyên dùng ⭐', 'Phổ biến']
  },
  { 
    id: 'w2', 
    code: 'W2', 
    name: 'Full Clean', 
    type: 'package', 
    price: 299000, 
    description: 'Bao gồm toàn bộ gói W1 • Giặt sấy thảm • Wax bóng bề mặt sơn • Vệ sinh mâm và khe kẽ.', 
    createdAt: '',
    colorType: 'normal',
    duration: 35,
    tags: ['Toàn diện', 'Wax bóng']
  },
  { 
    id: 'w3', 
    code: 'W3', 
    name: 'Super Shine', 
    type: 'package', 
    price: 649000, 
    description: 'Bao gồm toàn bộ gói W2 • Dưỡng taplo chống UV • Dưỡng phục hồi nhựa • Dưỡng da ghế cao cấp.', 
    createdAt: '',
    label: 'Khuyên dùng',
    colorType: 'primary',
    duration: 50,
    tags: ['Khuyên dùng ⭐', 'Dưỡng da & nhựa']
  },
  { 
    id: 'w4', 
    code: 'W4', 
    name: 'Detail Care', 
    type: 'package', 
    price: 1699000, 
    description: 'Bao gồm toàn bộ gói W3 • Rửa chi tiết tỉ mỉ • Tẩy nhựa đường + mạt sắt + ố chrome • Dưỡng taplo + da ghế.', 
    createdAt: '',
    label: 'Cao cấp',
    colorType: 'gold',
    duration: 70,
    tags: ['Cao cấp ✨', 'Chuyên sâu']
  },
  { 
    id: 'w5', 
    code: 'W5', 
    name: 'WASSUP PRIME', 
    type: 'package', 
    price: 3399000, 
    description: 'Bao gồm toàn bộ gói W4 • Gói dưỡng toàn diện cao cấp • Diệt khuẩn khử mùi ion âm • Phủ Ceramic bảo vệ sơn.', 
    createdAt: '',
    label: 'Đặc biệt',
    colorType: 'custom',
    duration: 90,
    tags: ['Đặc biệt 💎', 'Ceramic']
  },
];

export const ADDONS_CATALOG: Service[] = [
  { 
    id: 'add01', 
    code: 'ADD01', 
    name: 'Hút bụi sâu & vệ sinh khe kẽ nội thất', 
    type: 'addon', 
    price: 99000, 
    description: 'Hút bụi sâu các hộc cửa, rãnh ghế và khe kẽ taplo, thổi khí nén.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Nội thất', 'Hút bụi'],
    duration: 10
  },
  { 
    id: 'add02', 
    code: 'ADD02', 
    name: 'Xông khử khuẩn Nano Bạc khoang xe', 
    type: 'addon', 
    price: 499000, 
    description: 'Công nghệ sương mù Nano Bạc diệt khuẩn giàn lạnh, khử mùi hôi ẩm mốc.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Khử khuẩn', 'Nano Bạc'],
    duration: 15
  },
  { 
    id: 'add03', 
    code: 'ADD03', 
    name: 'Dưỡng da ghế cao cấp chống nứt nẻ', 
    type: 'addon', 
    price: 249000, 
    description: 'Lau sạch da chuyên dụng, thoa kem dưỡng chống nứt nẻ tia UV.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Da ghế', 'Dưỡng chất'],
    duration: 15
  },
  { 
    id: 'add04', 
    code: 'ADD04', 
    name: 'Tẩy ố kính lái & gương chiếu hậu 3M', 
    type: 'addon', 
    price: 499000, 
    description: 'Tẩy cặn canxi vảy cá, ố mốc kính lái, cải thiện tầm nhìn an toàn.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Kính lái', 'Tẩy ố 3M'],
    duration: 20
  },
  { 
    id: 'add05', 
    code: 'ADD05', 
    name: 'Tẩy nhựa đường & mạt sắt bám thân xe', 
    type: 'addon', 
    price: 399000, 
    description: 'Rã đốm nhựa đường và mạt sắt li ti, bảo vệ nước sơn zin.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Ngoại thất', 'Tẩy nhựa đường'],
    duration: 20
  },
  { 
    id: 'add06', 
    code: 'ADD06', 
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
    id: 'add07', 
    code: 'ADD07', 
    name: 'Khử mùi sinh học ion bạc', 
    type: 'addon', 
    price: 80000, 
    description: 'Xông tinh dầu thảo mộc thiên nhiên diệt khuẩn nấm mốc máy lạnh.', 
    createdAt: '',
    thumbnail: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400&h=400',
    tags: ['Khử mùi', 'Bạc hà'],
    duration: 15
  },
];
