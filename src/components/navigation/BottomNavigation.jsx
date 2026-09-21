import {
  BarChart3,
  ListTodo,
  Lock,
  NotebookText,
} from "lucide-react";

import { motion } from "framer-motion";

const navigationItems = [
  {
    name: "Inicio",
    icon: ListTodo,
  },
  {
    name: "Herramientas",
    icon: NotebookText,
  },
  {
    name: "Progreso",
    icon: BarChart3,
  },
  {
    name: "Cuentas",
    icon: Lock,
  },
];

export default function BottomNavigation({
  view,
  goToView,
}) {
  const activeIndex = Math.max(
    0,
    navigationItems.findIndex(
      (item) => item.name === view
    )
  );

  return (
    <nav className="bottom-nav">
      <motion.div
        className="bottom-nav-wave"
        animate={{
          x: `${activeIndex * 100}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 30,
          mass: 0.8,
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 86"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path
            d="
              M 0 86
              C 20 86, 28 78, 34 63
              C 41 47, 39 24, 56 13
              C 69 4, 83 4, 100 4
              C 117 4, 131 4, 144 13
              C 161 24, 159 47, 166 63
              C 172 78, 180 86, 200 86
              Z
            "
          />
        </svg>
      </motion.div>

      {navigationItems.map(
        ({ name, icon: Icon }) => {
          const isActive = view === name;

          return (
            <button
              key={name}
              type="button"
              className={
                isActive
                  ? "bottom-nav-item active"
                  : "bottom-nav-item"
              }
              onClick={() => goToView(name)}
              aria-label={name}
              aria-current={
                isActive ? "page" : undefined
              }
            >
              <Icon />
              <span>{name}</span>
            </button>
          );
        }
      )}
    </nav>
  );
}
