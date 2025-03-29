export const twoSteps = (url: string): string => {

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
      <p>Para poder verificar tu cuenta necesitas estar conectado a la misma red que el servidor</p>
      <a href="${url}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
      ">Verificar</a>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p>${url}</p>
    </body>
  </html>
  `;
};