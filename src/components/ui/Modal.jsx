import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import { Button } from './Button';

export function Modal({ open, title, description, onClose, children }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="surface mx-auto w-full max-w-app p-5"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <div className="section-label mb-2">FORGE</div>
              <h3 className="display-title text-3xl">{title}</h3>
              {description ? <p className="mt-2 text-sm text-forge-muted2">{description}</p> : null}
            </div>
            {children}
            <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>
              Close
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
