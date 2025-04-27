import styled from '@emotion/styled';

const Marker = styled.div({
  backgroundColor: 'grey',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '2px solid black',
  fontSize: '16px',
  color: 'black',
});

export interface AddMarkerProps {
  onClick: () => void;
}

const AddMarker: React.FC<AddMarkerProps> = ({ onClick }) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();

    onClick();
  };

  return (
    <Marker onClick={handleClick}>
      <span>+</span>
    </Marker>
  );
};

export default AddMarker;
