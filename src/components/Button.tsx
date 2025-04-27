import styled from '@emotion/styled';

export type ButtonType = 'success' | 'danger' | 'info' | 'secondary';

export interface ButtonProps {
  text: string;
  type: ButtonType;
  icon: string | React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  onClick: () => void;
}

type BaseButtonProps = {
  buttonType: ButtonType;
  pressed?: boolean;
};

const StyledButton = styled.button<BaseButtonProps>(
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    width: '200px',
    height: '40px',
    cursor: 'pointer',
    transition: '0.25s',
  },
  ({ buttonType, disabled, pressed }) => ({
    ...(buttonType === 'success'
      ? {
          backgroundColor: 'green',
        }
      : {}),
    ...(buttonType === 'danger'
      ? {
          backgroundColor: 'red',
          color: 'black',
        }
      : {}),
    ...(buttonType === 'info'
      ? {
          backgroundColor: 'blue',
        }
      : {}),
    ...(buttonType === 'secondary' ? { backgroundColor: 'grey' } : {}),
    ...(disabled ? { backgroundColor: 'lighgray', color: 'gray', cursor: 'default' } : {}),
    ...(pressed ? { boxShadow: 'inset 0px 0px 8px black', outline: 'none' } : {}),
  })
);

const AwesomeButton: React.FC<ButtonProps> = (props) => {
  const { icon, text, type, disabled, pressed, onClick } = props;

  return (
    <StyledButton buttonType={type} disabled={disabled} pressed={pressed} onClick={onClick}>
      {typeof icon === 'string' ? <i className={icon}></i> : icon}
      <span>{text}</span>
    </StyledButton>
  );
};

export default AwesomeButton;
