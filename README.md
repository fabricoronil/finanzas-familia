# Finanzas de la familia

App web para llevar los ingresos, gastos fijos, gastos del día a día y deudas de la casa. Hace las cuentas sola: cuánto queda disponible, qué falta pagar, a dónde va la plata y cuándo terminan las deudas.

- Funciona en el celular (se puede agregar a la pantalla de inicio como una app) y en la compu.
- Modo claro y oscuro automático.
- HTML, CSS y JavaScript sin compilación: se publica tal cual en GitHub Pages.

## Modo prueba y modo compartido

Mientras `config.js` tenga `firebaseConfig = null`, la app funciona en **modo prueba**: los datos quedan guardados solo en el navegador donde se abre.

Para que toda la familia vea y cargue los mismos datos desde su celular, se conecta a **Firebase** (gratis). Cada uno entra con su cuenta de Google y solo los emails autorizados pueden ver los datos.

## Estado actual

Conectada al proyecto de Firebase `gestiondedinero-df3ee` (Firestore en `southamerica-east1`). El dueño (`coronilfabri@gmail.com`, ver `config.js`) suma a la familia desde **Ajustes → Quiénes pueden entrar**. Las reglas se publican con:

```sh
firebase deploy --only firestore:rules
```

## Configurar Firebase desde cero (referencia)

1. Entrá a <https://console.firebase.google.com> y tocá **Crear un proyecto**. Nombre: `finanzas-familia`. Google Analytics no hace falta.
2. **Authentication** → **Comenzar** → **Google** → activalo, elegí tu email de asistencia y guardá.
3. En **Authentication → Configuración → Dominios autorizados**, agregá `fabricoronil.github.io`.
4. **Firestore Database** → **Crear base de datos** → ubicación `southamerica-east1 (São Paulo)` → **modo de producción**.
5. En **Firestore → Reglas**, pegá el contenido de [`firestore.rules`](firestore.rules) (con el email del dueño) y tocá **Publicar**.
6. **Configuración del proyecto** (engranaje) → **Tus apps** → ícono web `</>` → registrá la app. Copiá el objeto `firebaseConfig` que te muestra y pegalo en [`config.js`](config.js).
7. Subí el cambio a GitHub. En un minuto la app publicada pasa a pedir el inicio de sesión con Google.

> La configuración de Firebase no es secreta: identifica el proyecto, pero quién puede leer y escribir lo deciden las reglas del paso 5.

## Sumar o sacar a alguien

El dueño entra a la app, va a **Ajustes → Quiénes pueden entrar** y agrega o quita el email de Google de la persona.

## Probar en la compu

```sh
python3 -m http.server 8000
```

y abrí <http://localhost:8000>.

## Cómo calcula

- **Disponible del mes** = ingresos − gastos fijos − cuotas de deudas − gastos del mes.
- Los **ingresos** "todos los meses" y los **gastos fijos** se repiten desde el mes en que se cargan. Cada mes empiezan sin marcar como pagados.
- Al marcar como pagada la **cuota de una deuda**, se descuenta del saldo. Si la desmarcás, se devuelve.
- **Libres de deudas**: el mes en que termina la última deuda si se sigue pagando la cuota actual.
