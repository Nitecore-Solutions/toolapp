export type TemplateType = 'college' | 'school_horiz' | 'school_vert' | 'inter_college' | 'press';

export interface CardData {
  collegeName: string;
  collegeAddress: string;
  session: string;
  studentName: string;
  rollNo: string;
  fatherName: string;
  courseOrClass: string;
  dob: string;
  phone: string;
  valid: string;
  address: string;
}

export const DEFAULT_VALUES: Record<TemplateType, CardData> = {
  college: {
    collegeName: 'SUNRISE COLLEGE OF ENGINEERING',
    collegeAddress: 'Kanpur, Uttar Pradesh',
    session: '2025-26',
    studentName: 'SUMIT KUMAR',
    rollNo: '24EE012',
    fatherName: 'Sandeep Singh',
    courseOrClass: 'B.Tech (EE)',
    dob: '12/08/2004',
    phone: '+91 9876543210',
    valid: 'JUNE 2029',
    address: 'Varanasi, UP',
  },
  school_horiz: {
    collegeName: 'GYAN DEEP HIGH SCHOOL',
    collegeAddress: 'Agra, Uttar Pradesh',
    session: '2025-26',
    studentName: 'ROHIT VERMA',
    rollNo: '10245',
    fatherName: 'Anil Verma',
    courseOrClass: '8 - A',
    dob: '15/04/2012',
    phone: '+91 9123456789',
    valid: '',
    address: 'Agra, Uttar Pradesh',
  },
  school_vert: {
    collegeName: 'JAYPURIYA PUBLIC SCHOOL',
    collegeAddress: 'Babirpur Chauraha, Varanasi',
    session: '2025-26',
    studentName: 'SUMIT KUMAR',
    rollNo: 'S004',
    fatherName: 'Sandeep Singh',
    courseOrClass: '6 - B',
    dob: '12/12/2014',
    phone: '+91 9900012345',
    valid: '',
    address: 'Varanasi, UP',
  },
  inter_college: {
    collegeName: 'GYAN DEEP INTER COLLEGE',
    collegeAddress: 'Rabupura (G.B. Nagar)',
    session: '2026-27',
    studentName: 'Anoop Singh',
    rollNo: 'IC450',
    fatherName: 'Sandeep Singh',
    courseOrClass: '11 - Science',
    dob: '15/07/2008',
    phone: '+91 9876543210',
    valid: '',
    address: 'Varanasi, UP',
  },
  press: {
    collegeName: 'GLOBAL TIMES NEWS',
    collegeAddress: 'Truth. Integrity. Impact.',
    session: '',
    studentName: 'Anoop Singh',
    rollNo: 'GTN-1025',
    fatherName: '',
    courseOrClass: 'Dec 2026',
    dob: 'anoop@gtnnews.com',
    phone: '+91 9876543210',
    valid: 'Press Reporter',
    address: 'Editor In Chief',
  },
};
