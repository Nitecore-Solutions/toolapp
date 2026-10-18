export type ToolCategory = 'Image' | 'PDF' | 'Govt Form' | 'Utility';

export interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  icon: string;
  endpoint: string;
  description: string;
}

export const TOOLS: ToolItem[] = [
  // 1. Add Name & Date
  { 
    id: 'add-name-date', 
    name: 'Add Name & Date', 
    category: 'Image', 
    icon: 'Type', 
    endpoint: '/api/image/add-name-date',
    description: 'Superimpose custom name and date text on photos.'
  },
  // 2. Photo Signature Joiner
  { 
    id: 'join-photo-sig', 
    name: 'Photo Signature Joiner', 
    category: 'Image', 
    icon: 'Grid', 
    endpoint: '/api/image/join-photo-signature',
    description: 'Merge your passport photo and signature into one image.'
  },
  // 3. Image to PDF
  { 
    id: 'image-to-pdf', 
    name: 'Image to PDF', 
    category: 'PDF', 
    icon: 'FileUp', 
    endpoint: '/api/pdf/image-to-pdf',
    description: 'Convert multiple images into a single PDF.'
  },
  // 4. Age Calculator
  { 
    id: 'age-calculator', 
    name: 'Age Calculator', 
    category: 'Utility', 
    icon: 'Calendar', 
    endpoint: '/api/utility/age-calculator',
    description: 'Calculate precise age and remaining days to next birthday.'
  },

  // 5b. PDF Editor (Sejda-style visual editor)
  { 
    id: 'pdf-editor', 
    name: 'PDF Editor', 
    category: 'PDF', 
    icon: 'FilePen', 
    endpoint: '/api/pdf/apply-edits',
    description: 'Add text, images, shapes, signatures and annotations to PDFs.'
  },
  // 6. Passport Photo Maker (Passport Size Photo)
  { 
    id: 'passport-photo', 
    name: 'Passport Size Photo', 
    category: 'Image', 
    icon: 'UserCheck', 
    endpoint: '/api/image/passport-photo',
    description: 'Create standard sized passport photographs.'
  },
  // 7. Image to 20KB
  { 
    id: 'image-to-20kb', 
    name: 'Image to 20KB', 
    category: 'Image', 
    icon: 'ArrowDownCircle', 
    endpoint: '/api/image/compress-to-kb',
    description: 'Fast-compress photos to exactly under 20KB.'
  },
  // 8. PDF to JPG
  { 
    id: 'pdf-to-jpg', 
    name: 'PDF to JPG', 
    category: 'PDF', 
    icon: 'FileDown', 
    endpoint: '/api/pdf/pdf-to-jpg',
    description: 'Extract PDF pages as individual JPEG images.'
  },
  { 
    id: 'compress-pdf', 
    name: 'Compress PDF Size', 
    category: 'PDF', 
    icon: 'FileArchive', 
    endpoint: '/api/pdf/compress',
    description: 'Compress PDF size exactly to 100KB, 200KB, 300KB, etc.'
  },
  // 9. Image Resizer
  { 
    id: 'resize', 
    name: 'Image Resizer', 
    category: 'Image', 
    icon: 'Scaling', 
    endpoint: '/api/image/resize',
    description: 'Resize image dimensions by width and height.'
  },
  // 10. Change Image Format (Convert Format)
  { 
    id: 'change-format', 
    name: 'Change Image Format', 
    category: 'Image', 
    icon: 'Shuffle', 
    endpoint: '/api/image/convert-format',
    description: 'Convert to PNG, WebP, BMP, and other formats.'
  },
  // 11. Signature Resizer
  { 
    id: 'signature-resizer', 
    name: 'Signature Resizer', 
    category: 'Image', 
    icon: 'PenTool', 
    endpoint: '/api/image/signature-resizer',
    description: 'Resize signature sizes exactly to specifications.'
  },
  // 12. Remove Background
  { 
    id: 'remove-bg', 
    name: 'Remove Background', 
    category: 'Image', 
    icon: 'Eraser', 
    endpoint: '/api/image/remove-bg',
    description: 'AI-powered background removal tool.'
  },


  // 13. MB to KB
  { 
    id: 'compress-kb', 
    name: 'MB to KB', 
    category: 'Image', 
    icon: 'Minimize2', 
    endpoint: '/api/image/compress-to-kb',
    description: 'Compress image size down to target KBs.'
  },
  // 14. JPG Converter
  { 
    id: 'format-convert', 
    name: 'JPG Converter', 
    category: 'Image', 
    icon: 'FileImage', 
    endpoint: '/api/image/convert-format',
    description: 'Convert any image format to standard JPG.'
  },

  // 17. Poster Editor
  {
    id: 'poster-editor',
    name: 'Poster Editor',
    category: 'Image',
    icon: 'LayoutTemplate',
    endpoint: '',
    description: 'Create custom posters with text, photos, colors & effects.',
  },
  {
    id: 'insta-prompts',
    name: 'Trending Photo Prompts',
    category: 'Image',
    icon: 'Sparkles',
    endpoint: '',
    description: 'Copy viral AI photo prompts for Instagram milestone posters.',
  },
  // 17. Resume Maker
  { 
    id: 'resume-maker', 
    name: 'Resume Maker', 
    category: 'Utility', 
    icon: 'Briefcase', 
    endpoint: '/api/utility/resume',
    description: 'Build professional resumes with responsive templates.'
  },
  // Typing Test
  { 
    id: 'typing-test', 
    name: 'Typing Practice Test', 
    category: 'Utility', 
    icon: 'Keyboard', 
    endpoint: '',
    description: 'Improve typing speed with 15 progressive lessons.'
  },
  // Biodata Maker
  {
    id: 'biodata-maker',
    name: 'Marriage Bio Data',
    category: 'Utility',
    icon: 'Heart',
    endpoint: '/api/pdf/biodata',
    description: 'Create a beautiful Shadi/Marriage Bio Data PDF with photos.'
  },

  // Govt Form Tools (18 to 25)
  { 
    id: 'nsdl-pan-signature', 
    name: 'NSDL PAN Signature Resize', 
    category: 'Govt Form', 
    icon: 'PenTool', 
    endpoint: '/api/form/nsdl-pan/signature-resize',
    description: 'Resize signature exactly for NSDL PAN (200x100px).'
  },
  { 
    id: 'nsdl-pan-photo', 
    name: 'NSDL PAN Photo Resizer', 
    category: 'Govt Form', 
    icon: 'CreditCard', 
    endpoint: '/api/form/nsdl-pan/photo-resize',
    description: 'Resize photo exactly for NSDL PAN (213x213px).'
  },
  { 
    id: 'rrb-signature', 
    name: 'RRB Signature Resizer', 
    category: 'Govt Form', 
    icon: 'PenTool', 
    endpoint: '/api/form/rrb/signature-resize',
    description: 'Resize signature for Railway Recruitment Board (RRB).'
  },
  { 
    id: 'rrb-photo', 
    name: 'RRB Photo Resizer', 
    category: 'Govt Form', 
    icon: 'Train', 
    endpoint: '/api/form/rrb/photo-resize',
    description: 'Resize photo for Railway Recruitment Board (RRB).'
  },

  { 
    id: 'upsc-photo', 
    name: 'UPSC Photo Resizer', 
    category: 'Govt Form', 
    icon: 'GraduationCap', 
    endpoint: '/api/form/upsc/photo-resize',
    description: 'Resize photo for UPSC Online Applications.'
  },
  { 
    id: 'ssc-signature', 
    name: 'SSC Signature Resizer', 
    category: 'Govt Form', 
    icon: 'PenTool', 
    endpoint: '/api/form/ssc/signature-resize',
    description: 'Resize signature for Staff Selection Commission (SSC).'
  },
  {
    id: 'college-card-maker',
    name: 'Online ID Card Maker',
    category: 'Utility',
    icon: 'CreditCard',
    endpoint: '',
    description: 'Create a beautiful custom ID Card with photo and details.'
  },
];

