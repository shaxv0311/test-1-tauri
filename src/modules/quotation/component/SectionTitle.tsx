interface SectionTitleProps {
  icon?: React.ReactNode;
  title: string;
}

export const SectionTitle = ({ icon, title }: SectionTitleProps) => {
  return (
    <div className="section-title">
      <span className="section-title-icon">{icon}</span>

      <p className="section-title-text">{title}</p>
    </div>
  );
};
