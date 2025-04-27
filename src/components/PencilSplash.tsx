import styled from '@emotion/styled';

const Container = styled.div({
  position: 'relative',
  display: 'inline-block',
  width: '20px',
  height: '11px',
});

const PencilSplash: React.FC = () => (
  <Container>
    <i className='fa-solid fa-slash' style={{ position: 'absolute', left: 0 }}></i>
    <i className='fa-solid fa-pencil' style={{ position: 'absolute', left: 2 }}></i>
  </Container>
);

export default PencilSplash;
