/**
 * Centralized Indian States & Administrative Districts Directory
 * Used for user-controlled location filtering and jurisdiction-specific guidance.
 */

export interface StateInfo {
  name: string
  code: string
  type: 'state' | 'ut'
  portalDomain: string
  districts: string[]
}

export const INDIAN_STATES: StateInfo[] = [
  {
    name: 'Tamil Nadu',
    code: 'TN',
    type: 'state',
    portalDomain: 'tn.gov.in',
    districts: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Tirunelveli',
      'Kanchipuram',
      'Chengalpattu',
      'Vellore',
      'Tiruvallur',
      'Erode',
      'Thanjavur',
      'Dindigul',
      'Cuddalore',
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    type: 'state',
    portalDomain: 'karnataka.gov.in',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Mysuru',
      'Dharwad',
      'Mangaluru (Dakshina Kannada)',
      'Belagavi',
      'Shivamogga',
      'Ballari',
      'Tumakuru',
      'Udupi',
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    type: 'state',
    portalDomain: 'maharashtra.gov.in',
    districts: [
      'Mumbai City',
      'Mumbai Suburban',
      'Pune',
      'Thane',
      'Nagpur',
      'Nashik',
      'Aurangabad (Chhatrapati Sambhajinagar)',
      'Solapur',
      'Kolhapur',
      'Amravati',
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    type: 'state',
    portalDomain: 'kerala.gov.in',
    districts: [
      'Thiruvananthapuram',
      'Ernakulam (Kochi)',
      'Kozhikode',
      'Thrissur',
      'Kollam',
      'Palakkad',
      'Malappuram',
      'Kannur',
      'Kottayam',
      'Alappuzha',
    ],
  },
  {
    name: 'Delhi',
    code: 'DL',
    type: 'ut',
    portalDomain: 'delhi.gov.in',
    districts: [
      'New Delhi',
      'Central Delhi',
      'South Delhi',
      'North Delhi',
      'East Delhi',
      'West Delhi',
      'South West Delhi',
      'North East Delhi',
      'North West Delhi',
      'Shahdara',
      'South East Delhi',
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    type: 'state',
    portalDomain: 'ap.gov.in',
    districts: [
      'Visakhapatnam',
      'Vijayawada (NTR)',
      'Guntur',
      'Tirupati',
      'Nellore',
      'Kurnool',
      'Kakinada',
      'Anantapur',
    ],
  },
  {
    name: 'Telangana',
    code: 'TG',
    type: 'state',
    portalDomain: 'telangana.gov.in',
    districts: [
      'Hyderabad',
      'Ranga Reddy',
      'Medchal-Malkajgiri',
      'Warangal',
      'Nizamabad',
      'Karimnagar',
      'Khammam',
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    type: 'state',
    portalDomain: 'up.gov.in',
    districts: [
      'Lucknow',
      'Kanpur Nagar',
      'Varanasi',
      'Gautam Buddha Nagar (Noida)',
      'Ghaziabad',
      'Agra',
      'Prayagraj',
      'Meerut',
      'Bareilly',
      'Gorakhpur',
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    type: 'state',
    portalDomain: 'wb.gov.in',
    districts: [
      'Kolkata',
      'North 24 Parganas',
      'South 24 Parganas',
      'Howrah',
      'Hooghly',
      'Darjeeling',
      'Paschim Bardhaman',
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    type: 'state',
    portalDomain: 'gujarat.gov.in',
    districts: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bhavnagar',
      'Jamnagar',
      'Gandhinagar',
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    type: 'state',
    portalDomain: 'rajasthan.gov.in',
    districts: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner', 'Alwar'],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    type: 'state',
    portalDomain: 'mp.gov.in',
    districts: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
  },
  {
    name: 'Bihar',
    code: 'BR',
    type: 'state',
    portalDomain: 'bihar.gov.in',
    districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  },
  {
    name: 'Punjab',
    code: 'PB',
    type: 'state',
    portalDomain: 'punjab.gov.in',
    districts: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'SAS Nagar (Mohali)'],
  },
  {
    name: 'Haryana',
    code: 'HR',
    type: 'state',
    portalDomain: 'haryana.gov.in',
    districts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Panchkula'],
  },
  {
    name: 'Odisha',
    code: 'OD',
    type: 'state',
    portalDomain: 'odisha.gov.in',
    districts: ['Khordha (Bhubaneswar)', 'Cuttack', 'Ganjam', 'Sundargarh (Rourkela)', 'Puri', 'Sambalpur'],
  },
  {
    name: 'Assam',
    code: 'AS',
    type: 'state',
    portalDomain: 'assam.gov.in',
    districts: ['Kamrup Metropolitan (Guwahati)', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon'],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    type: 'state',
    portalDomain: 'jharkhand.gov.in',
    districts: ['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    type: 'state',
    portalDomain: 'cgstate.gov.in',
    districts: ['Raipur', 'Durg', 'Bhilai', 'Bilaspur', 'Korba'],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    type: 'state',
    portalDomain: 'uk.gov.in',
    districts: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    type: 'state',
    portalDomain: 'himachal.gov.in',
    districts: ['Shimla', 'Kangra (Dharamshala)', 'Mandi', 'Solan', 'Kullu'],
  },
  {
    name: 'Goa',
    code: 'GA',
    type: 'state',
    portalDomain: 'goa.gov.in',
    districts: ['North Goa (Panaji)', 'South Goa (Margao)'],
  },
  {
    name: 'Jammu and Kashmir',
    code: 'JK',
    type: 'ut',
    portalDomain: 'jk.gov.in',
    districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    type: 'ut',
    portalDomain: 'ladakh.gov.in',
    districts: ['Leh', 'Kargil'],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    type: 'ut',
    portalDomain: 'chandigarh.gov.in',
    districts: ['Chandigarh'],
  },
  {
    name: 'Puducherry',
    code: 'PY',
    type: 'ut',
    portalDomain: 'py.gov.in',
    districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  },
  {
    name: 'Tripura',
    code: 'TR',
    type: 'state',
    portalDomain: 'tripura.gov.in',
    districts: ['West Tripura (Agartala)', 'Gomati', 'South Tripura'],
  },
  {
    name: 'Manipur',
    code: 'MN',
    type: 'state',
    portalDomain: 'manipur.gov.in',
    districts: ['Imphal West', 'Imphal East', 'Churachandpur'],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    type: 'state',
    portalDomain: 'meghalaya.gov.in',
    districts: ['East Khasi Hills (Shillong)', 'West Garo Hills (Tura)'],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    type: 'state',
    portalDomain: 'nagaland.gov.in',
    districts: ['Kohima', 'Dimapur', 'Mokokchung'],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    type: 'state',
    portalDomain: 'mizoram.gov.in',
    districts: ['Aizawl', 'Lunglei', 'Champhai'],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    type: 'state',
    portalDomain: 'arunachalpradesh.gov.in',
    districts: ['Papum Pare (Itanagar)', 'Changlang', 'West Kameng'],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    type: 'state',
    portalDomain: 'sikkim.gov.in',
    districts: ['East Sikkim (Gangtok)', 'West Sikkim (Gyalshing)', 'South Sikkim (Namchi)'],
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    type: 'ut',
    portalDomain: 'andaman.gov.in',
    districts: ['South Andaman (Port Blair)', 'North and Middle Andaman', 'Nicobar'],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    type: 'ut',
    portalDomain: 'ddd.gov.in',
    districts: ['Daman', 'Diu', 'Dadra and Nagar Haveli (Silvassa)'],
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    type: 'ut',
    portalDomain: 'lakshadweep.gov.in',
    districts: ['Kavaratti'],
  },
]

export interface UserLocationPreference {
  state?: string
  district?: string
  city?: string
}

export function getStateByName(stateName: string): StateInfo | undefined {
  if (!stateName) return undefined
  const query = stateName.trim().toLowerCase()
  return INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === query || s.code.toLowerCase() === query
  )
}

export function getDistrictsForState(stateName: string): string[] {
  const state = getStateByName(stateName)
  return state ? state.districts : []
}

export function isLocationMatched(
  serviceState: string,
  serviceDistrict?: string,
  userState?: string,
  userDistrict?: string
): boolean {
  if (!userState || userState === 'All India') return true
  if (serviceState === 'All India') return true

  const stateMatch = serviceState.toLowerCase() === userState.toLowerCase()
  if (!stateMatch) return false

  if (!serviceDistrict || !userDistrict) return true
  return serviceDistrict.toLowerCase() === userDistrict.toLowerCase()
}
