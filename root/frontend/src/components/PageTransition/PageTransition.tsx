import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PAGE_TRANSITION } from '@/constants/animation'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const PageTransition = ({ children, className }: PageTransitionProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration: PAGE_TRANSITION.duration,
      ease: PAGE_TRANSITION.ease,
    }}
  >
    {children}
  </motion.div>
)

export default PageTransition
