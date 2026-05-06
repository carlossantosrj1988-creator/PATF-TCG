const homeScreen = document.createElement('div');
homeScreen.id = 'home-screen';

homeScreen.innerHTML = `
  <div id="home-logo">PATF</div>
  <div id="home-subtitle">PAST AND THE FUTURE TCG</div>
  <div id="home-start">TOQUE PARA COMEÇAR</div>
`;

document.body.appendChild(homeScreen);
