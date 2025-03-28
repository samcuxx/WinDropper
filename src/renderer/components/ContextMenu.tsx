import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type MenuItemType = "separator" | "item";

interface MenuItemBase {
  type?: MenuItemType;
  label?: string;
  disabled?: boolean;
}

interface MenuItem extends MenuItemBase {
  type?: "item";
  onClick: () => void;
}

interface SeparatorItem extends MenuItemBase {
  type: "separator";
}

interface SubmenuItem extends MenuItemBase {
  submenu: (MenuItem | SeparatorItem)[];
}

type MenuOption = MenuItem | SeparatorItem | SubmenuItem;

interface ContextMenuProps {
  x: number;
  y: number;
  options: MenuOption[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  options,
  onClose,
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const [menuPosition, setMenuPosition] = useState({ x, y });
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position to ensure it stays within viewport
  const calculatePosition = () => {
    if (!menuRef.current) return { x, y };

    const menuRect = menuRef.current.getBoundingClientRect();
    const menuWidth = menuRect.width || 200; // Fallback if width is 0
    const menuHeight = menuRect.height || 300; // Fallback if height is 0

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    // Adjust X if menu would go off-screen right
    if (x + menuWidth > windowWidth) {
      posX = Math.max(windowWidth - menuWidth - 10, 10); // Keep 10px margin
    }

    // Adjust Y if menu would go off-screen bottom
    if (y + menuHeight > windowHeight) {
      posY = Math.max(windowHeight - menuHeight - 10, 10); // Keep 10px margin
    }

    // Ensure menu is never positioned offscreen
    posX = Math.max(10, posX);
    posY = Math.max(10, posY);

    return { x: posX, y: posY };
  };

  // Calculate position for submenu
  const calculateSubmenuPosition = (index: number) => {
    if (!menuRef.current) return { x: 0, y: 0 };

    const menuRect = menuRef.current.getBoundingClientRect();
    const itemElements = menuRef.current.querySelectorAll(".context-menu-item");
    const windowWidth = window.innerWidth;

    if (index < itemElements.length) {
      const itemRect = itemElements[index].getBoundingClientRect();

      // Position submenu to the right of the item
      let submenuX = menuRect.right;
      let submenuY = itemRect.top;

      // Constrain to window width
      const estimatedSubmenuWidth = 200; // Default estimate
      if (submenuX + estimatedSubmenuWidth > windowWidth) {
        // If not enough space on right, position to left
        submenuX = Math.max(10, menuRect.left - estimatedSubmenuWidth);
      }

      // Ensure submenu Y is within screen
      const windowHeight = window.innerHeight;
      const estimatedSubmenuHeight = 200; // Default estimate
      if (submenuY + estimatedSubmenuHeight > windowHeight) {
        submenuY = Math.max(10, windowHeight - estimatedSubmenuHeight - 10);
      }

      setSubmenuPosition({ x: submenuX, y: submenuY });
    }
  };

  // Handle submenu hover
  const handleSubmenuHover = (index: number) => {
    calculateSubmenuPosition(index);
    setActiveSubmenu(index);
  };

  // Handle menu item click
  const handleItemClick = (option: MenuItem) => {
    if (!option.disabled) {
      option.onClick();
      onClose();
    }
  };

  // Handle click outside menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Recalculate position when menu changes
  useEffect(() => {
    const updateMenuPosition = () => {
      const pos = calculatePosition();
      setMenuPosition(pos);
    };

    // Call immediately
    updateMenuPosition();

    // Also call on resize
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [options, x, y]);

  // Determine if an option is a submenu
  const isSubmenu = (option: MenuOption): option is SubmenuItem => {
    return "submenu" in option && Array.isArray(option.submenu);
  };

  // Use a portal to render the menu at the document level, outside the WinDropper bounds
  return createPortal(
    <motion.div
      ref={menuRef}
      className="windropper-notch absolute z-50 shadow-lg py-1 rounded-md min-w-[180px] max-w-[250px]"
      style={{ left: menuPosition.x, top: menuPosition.y }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {options.map((option, index) => {
        if (option.type === "separator") {
          return (
            <hr
              key={`sep-${index}`}
              className="my-1 border-gray-200 dark:border-gray-700"
            />
          );
        }

        const isSubMenu = isSubmenu(option);
        const isDisabled = option.disabled;

        return (
          <div
            key={`option-${index}`}
            className={`context-menu-item relative px-4 py-2 text-sm ${
              isDisabled
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            }`}
            onClick={() =>
              !isDisabled && !isSubMenu && handleItemClick(option as MenuItem)
            }
            onMouseEnter={() =>
              isSubMenu && !isDisabled && handleSubmenuHover(index)
            }
            onMouseLeave={() => isSubMenu && setActiveSubmenu(null)}
          >
            <div className="flex items-center justify-between">
              <span>{option.label}</span>
              {isSubMenu && (
                <svg
                  className="w-4 h-4 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>

            {/* Submenu */}
            <AnimatePresence>
              {isSubMenu && activeSubmenu === index && (
                <motion.div
                  className="windropper-notch absolute z-50 shadow-lg py-1 rounded-md min-w-[180px] max-w-[250px]"
                  style={{
                    left: submenuPosition.x - menuPosition.x,
                    top: submenuPosition.y - menuPosition.y,
                  }}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.1 }}
                >
                  {(option as SubmenuItem).submenu.map(
                    (subOption, subIndex) => {
                      if (subOption.type === "separator") {
                        return (
                          <hr
                            key={`subsep-${subIndex}`}
                            className="my-1 border-gray-200 dark:border-gray-700"
                          />
                        );
                      }

                      const isSubDisabled = subOption.disabled;

                      return (
                        <div
                          key={`suboption-${subIndex}`}
                          className={`px-4 py-2 text-sm ${
                            isSubDisabled
                              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          }`}
                          onClick={() =>
                            !isSubDisabled &&
                            handleItemClick(subOption as MenuItem)
                          }
                        >
                          {subOption.label}
                        </div>
                      );
                    }
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>,
    document.body
  );
};
