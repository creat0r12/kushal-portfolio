export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  year: string;
  link?: string;
  status?: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Mess Management App",
    category: "Full-Stack Application",
    description:
      "A mobile-first platform for managing students, payments, leaves, memberships, and mess operations.",
    year: "2026",
    link: "https://mess-app-next-1.onrender.com/",
    status: "LIVE",
  },
  {
    id: 2,
    title: "Creative Portfolio",
    category: "Web Experience",
    description:
      "An experimental personal portfolio focused on interaction, visual storytelling, and motion.",
    year: "2026",
    status: "EXPERIMENT",
  },
  {
    id: 3,
    title: "Creator Toolkit",
    category: "Product Concept",
    description:
      "A collection of tools designed to help creators organize, build, and publish their work.",
    year: "2026",
    status: "CONCEPT",
  },
];