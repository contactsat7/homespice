// src/app/core/models/index.ts

export interface MenuItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner' | 'Drinks';
  price: number;
  description: string;
  ingredients: string;
  diet: 'veg' | 'vegan' | 'nonveg';
  image: string;
  available: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  diet: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address?: string;
  orderType: 'delivery' | 'pickup';
  notes?: string;
}

export interface Order {
  id?: string;
  orderId: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  paymentMethod: 'eway' | 'cash';
  ewayTransactionId?: string;
  ewayAuthCode?: string;
  status?: OrderStatus;
  userId?: string;
  tableNum?: string | null;
  createdAt?: any;
  updatedAt?: any;
  createdAtLocal?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  emailVerified: boolean;
  loyaltyPoints: number;
  orderCount: number;
  createdAt?: any;
  lastLogin?: any;
}

export interface LoyaltyEntry {
  userId: string;
  points: number;
  orderId: string;
  createdAt?: any;
}

export type Theme = 'light' | 'dark';

export const MENU_CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Drinks'] as const;
export type MenuCategory = typeof MENU_CATEGORIES[number];

export const SEED_MENU: Omit<MenuItem, 'id'>[] = [
  { name:'Masala Dosa', category:'Breakfast', price:14.90, description:'Crispy rice crepe filled with spiced potato masala, served with sambar and fresh coconut chutney', ingredients:'Rice batter, urad dal, potato, onion, mustard seeds, curry leaves, turmeric, green chilli', diet:'vegan', image:'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=75', available:true },
  { name:'Pongal', category:'Breakfast', price:13.50, description:'Comforting slow-cooked rice and moong dal porridge tempered with ghee, peppercorns and cashews', ingredients:'Rice, moong dal, ghee, black pepper, cumin, ginger, cashews, curry leaves', diet:'veg', image:'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&q=75', available:true },
  { name:'Idli Sambar', category:'Breakfast', price:12.90, description:'Soft steamed rice cakes served with piping hot lentil sambar and three house chutneys', ingredients:'Idli batter, toor dal, tamarind, tomato, shallots, spices', diet:'vegan', image:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=75', available:true },
  { name:'Poha', category:'Breakfast', price:11.90, description:'Flattened rice flakes sautéed with peanuts, green chilli, lemon and fresh coriander', ingredients:'Flattened rice, peanuts, onion, green chilli, mustard seeds, curry leaves, turmeric, lemon', diet:'vegan', image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=75', available:true },
  { name:'Dal Makhani', category:'Lunch', price:19.90, description:'Overnight slow-cooked black lentils in rich tomato-cream sauce — the ultimate comfort dish', ingredients:'Black lentils, kidney beans, butter, cream, tomato, ginger, garlic, garam masala', diet:'veg', image:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=75', available:true },
  { name:'Chicken Biryani', category:'Lunch', price:24.90, description:'Fragrant basmati rice layered with spice-marinated chicken, saffron and caramelised onions', ingredients:'Basmati rice, chicken, yogurt, saffron, caramelised onions, whole spices, mint, ghee', diet:'nonveg', image:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=75', available:true },
  { name:'Paneer Butter Masala', category:'Lunch', price:21.90, description:'Cottage cheese cubes bathed in silky tomato-butter-cream gravy, mildly spiced and aromatic', ingredients:'Paneer, tomato, butter, cream, cashews, onion, ginger, garlic, kashmiri chilli', diet:'veg', image:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=75', available:true },
  { name:'Lamb Rogan Josh', category:'Lunch', price:26.90, description:'Tender slow-braised lamb in aromatic Kashmiri gravy with whole spices and dried chillies', ingredients:'Lamb, Kashmiri chilli, curd, whole spices, ginger, garlic, onion, ghee', diet:'nonveg', image:'https://images.unsplash.com/photo-1545247181-516773cae754?w=500&q=75', available:true },
  { name:'Vegetable Thali', category:'Lunch', price:22.90, description:'A complete Indian meal — dal, two sabzis, rice, roti, pickle and papad in one plate', ingredients:'Seasonal vegetables, lentils, basmati rice, whole wheat roti, assorted spices', diet:'veg', image:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=75', available:true },
  { name:'Samosa (2 pcs)', category:'Snacks', price:8.90, description:'Golden crispy pastry filled with spiced potato and peas, with tamarind and mint chutney', ingredients:'Maida, potato, green peas, cumin, coriander, ginger, green chilli, amchur', diet:'vegan', image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=75', available:true },
  { name:'Chicken Tikka', category:'Snacks', price:17.90, description:'Succulent yogurt-marinated chicken chargrilled in the tandoor, with mint chutney', ingredients:'Chicken, yogurt, lemon, ginger, garlic, kashmiri chilli, cumin, coriander, garam masala', diet:'nonveg', image:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=75', available:true },
  { name:'Bhel Puri', category:'Snacks', price:9.90, description:'Mumbai street-food favourite — puffed rice tossed with tamarind, mint, onion and chutneys', ingredients:'Puffed rice, sev, onion, tomato, potato, tamarind chutney, green chutney, coriander', diet:'vegan', image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=75', available:true },
  { name:'Pani Puri (6 pcs)', category:'Snacks', price:10.90, description:'Hollow crispy puris filled with spiced potato, chickpea and tangy tamarind water', ingredients:'Semolina puris, potato, chickpea, tamarind water, mint, chilli, black salt, cumin', diet:'vegan', image:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&q=75', available:true },
  { name:'Butter Chicken', category:'Dinner', price:24.90, description:"Australia's favourite — tender chicken in velvety tomato-cream sauce, mildly spiced", ingredients:'Chicken, tomato, butter, cream, cashews, ginger, garlic, garam masala, kashmiri chilli', diet:'nonveg', image:'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=75', available:true },
  { name:'Palak Paneer', category:'Dinner', price:21.90, description:'Fresh cottage cheese in vibrant spinach gravy seasoned with garlic, ginger and spices', ingredients:'Paneer, spinach, onion, tomato, ginger, garlic, cream, cumin, garam masala', diet:'veg', image:'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=500&q=75', available:true },
  { name:'Prawn Masala', category:'Dinner', price:27.90, description:'Tiger prawns in robust coastal masala with coconut milk, kokum and fresh curry leaves', ingredients:'Tiger prawns, coconut milk, onion, tomato, ginger, garlic, kokum, mustard seeds, curry leaves', diet:'nonveg', image:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=75', available:true },
  { name:'Garlic Naan', category:'Dinner', price:4.90, description:'Fluffy tandoor-baked bread brushed with garlic butter and fresh coriander', ingredients:'Maida, yeast, yogurt, salt, garlic, butter, coriander', diet:'veg', image:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=75', available:true },
  { name:'Gulab Jamun', category:'Dinner', price:8.90, description:'Soft milk-solid dumplings soaked in rose and cardamom sugar syrup, served warm', ingredients:'Khoya, maida, baking soda, rose water, cardamom, sugar syrup, pistachios', diet:'veg', image:'https://images.unsplash.com/photo-1601303516371-e673c75b766e?w=500&q=75', available:true },
  { name:'Masala Chai', category:'Drinks', price:4.90, description:'Spiced Indian milk tea brewed with ginger, cardamom, cinnamon and freshly ground spices', ingredients:'Assam tea, milk, ginger, cardamom, cinnamon, cloves, black pepper, sugar', diet:'veg', image:'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500&q=75', available:true },
  { name:'Mango Lassi', category:'Drinks', price:6.90, description:'Thick chilled yogurt drink blended with fresh Alphonso mango pulp and a hint of cardamom', ingredients:'Yogurt, mango pulp, sugar, cardamom, saffron', diet:'veg', image:'https://images.unsplash.com/photo-1527761939622-9119a3a08f6a?w=500&q=75', available:true },
  { name:'Rose Sharbat', category:'Drinks', price:5.90, description:'Chilled rose-scented drink with basil seeds, perfect for warm Australian days', ingredients:'Rose syrup, basil seeds, milk, sugar, ice', diet:'veg', image:'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=500&q=75', available:true },
  { name:'Filter Coffee', category:'Drinks', price:4.50, description:'South Indian style decoction coffee with chicory, served in a traditional tumbler', ingredients:'Coffee decoction, chicory, full cream milk, sugar', diet:'veg', image:'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500&q=75', available:true }
];
