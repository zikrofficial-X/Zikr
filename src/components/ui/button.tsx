import * as React from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<Variant, string> = {
  primary: "bg-brand-gold text-brand-emeraldDeep hover:bg-brand-goldSoft",
  secondary:
    "bg-brand-emerald text-brand-cream border border-brand-gold/50 hover:bg-brand-emeraldDeep",
  ghost: "text-brand-gold hover:bg-brand-gold/10",
  outline: "border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "h-10 w-10 p-0",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50";

type CommonButtonProps = {
  variant?: Variant;
  size?: Size;
};

type ButtonAsButtonProps = CommonButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonAsLinkProps = CommonButtonProps &
  Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof LinkProps | "href"
  > &
  Pick<LinkProps, "href" | "replace" | "scroll" | "prefetch" | "locale">;

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function isExternalHref(href: LinkProps["href"]): href is string {
  return typeof href === "string" && /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if ("href" in props && props.href !== undefined) {
    const {
      href,
      replace,
      scroll,
      prefetch,
      locale,
      children,
      ...anchorProps
    } = props;

    if (isExternalHref(href)) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        replace={replace}
        scroll={scroll}
        prefetch={prefetch}
        locale={locale}
        className={classes}
        {...anchorProps}
      >
        {children}
      </Link>
    );
  }

  return <button className={classes} {...props} />;
}
