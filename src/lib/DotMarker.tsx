import styled from '@emotion/styled';

export type MarkerColorType = 'blue' | 'red' | 'grey';

export interface DotMarkerProps {
  label: string;
  color: MarkerColorType;
}

const MarkerLabel = styled.div({
  width: '20px',
  fontSize: '14px',
  color: 'black',
  textAlign: 'center',
  marginTop: '5px',
  backgroundColor: 'white',
  border: '2px solid black',
  borderRadius: '20%',
});

const Dot = styled.div<DotMarkerProps>(
  {
    width: '10px',
    height: '10px',
    backgroundColor: 'grey',
    borderRadius: '50%',
    position: 'relative',
  },
  ({ color }) => ({
    backgroundColor: color,
  })
);

const DotMarker: React.FC<DotMarkerProps> = (props) => {
  const { label, color } = props;

  return (
    <>
      <Dot label={label} color={color} />
      <MarkerLabel>{label}</MarkerLabel>
    </>
  );
};

export default DotMarker;
