export type CertificateStyle = {
  issuer: string;
  track: string;
  accent: string;
  deep: string;
  soft: string;
  seal: string;
};

const styles: { match: RegExp; style: CertificateStyle }[] = [
  { match: /security|cyber|fortinet|soc|threat|penetration|blue team/i, style: { issuer: "Lumio Cybersecurity Academy", track: "SECURITY OPERATIONS", accent: "#138c91", deep: "#103e52", soft: "#e4f5f3", seal: "CYBER DEFENSE" } },
  { match: /network|comptia|network\+/i, style: { issuer: "Lumio Network Academy", track: "NETWORKING", accent: "#2771bd", deep: "#193c68", soft: "#e8f1fc", seal: "NETWORKING" } },
  { match: /support|hardware|help ?desk|a\+|it essentials/i, style: { issuer: "Lumio IT Academy", track: "IT SUPPORT", accent: "#bb7624", deep: "#653c19", soft: "#fcf1df", seal: "IT SUPPORT" } },
  { match: /cloud|docker|devops/i, style: { issuer: "Lumio Cloud & DevOps Academy", track: "CLOUD & DEVOPS", accent: "#5859c9", deep: "#34316f", soft: "#efedff", seal: "CLOUD BUILDER" } },
  { match: /design|figma|ui|ux/i, style: { issuer: "Lumio Design Academy", track: "PRODUCT DESIGN", accent: "#bf4f78", deep: "#672943", soft: "#fff0f5", seal: "DESIGN PRACTICE" } },
  { match: /business|marketing|founder|content/i, style: { issuer: "Lumio Business Academy", track: "BUSINESS & MARKETING", accent: "#40865e", deep: "#214d39", soft: "#eaf5ed", seal: "BUSINESS SKILLS" } },
];

const standard: CertificateStyle = { issuer: "Lumio Technology Academy", track: "SOFTWARE DEVELOPMENT", accent: "#5b63dc", deep: "#27305e", soft: "#eff0ff", seal: "SOFTWARE PRACTICE" };

export function getCertificateStyle(title: string, category: string): CertificateStyle {
  const match = styles.find(item => item.match.test(`${title} ${category}`));
  return match?.style ?? standard;
}
