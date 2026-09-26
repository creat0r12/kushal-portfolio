interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`container ${className}`}>
      {children}
    </div>
  );
}

export default Container;