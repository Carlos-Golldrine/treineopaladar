type IconProps = {
  /** SVG bruto importado via `?raw` (Material Symbols Rounded, so os usados) */
  svg: string;
  size?: number;
  /** Quando presente, o icone vira imagem acessivel; sem label, e decorativo */
  label?: string;
  className?: string;
};

export function Icon({ svg, size = 24, label, className }: IconProps) {
  return (
    <span
      className={className ? `icon ${className}` : 'icon'}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
