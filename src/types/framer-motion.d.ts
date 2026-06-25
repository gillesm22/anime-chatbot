import "framer-motion";

// framer-motion v10 types are incompatible with React 19's JSX types.
// This augmentation allows standard HTML + button/input attributes on motion components.
declare module "framer-motion" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MotionProps
    extends React.HTMLAttributes<HTMLElement>,
      Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "type" | "form" | "value" | "name"> {}
}
