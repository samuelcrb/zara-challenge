import styles from './ErrorMessage.module.scss'

interface ErrorMessageProps {
  message: string
}

const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <div className={styles.error} role="alert">
    {message}
  </div>
)

export default ErrorMessage
