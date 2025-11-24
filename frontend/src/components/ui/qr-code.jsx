import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';

export function QRCode({ value, size = 256, level = 'H', className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`inline-block p-4 bg-white rounded-lg shadow-lg ${className}`}
    >
      <QRCodeCanvas
        value={value}
        size={size}
        level={level}
        includeMargin={true}
      />
    </motion.div>
  );
}
