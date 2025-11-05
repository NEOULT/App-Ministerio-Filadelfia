import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { LogoFiladelfia } from "./assets/SVG/LogoFila";
import { Modal } from "./components/Modal/Modal";
import { Form } from "./components/Form/Form";
import { AsistenceModal } from "./components/Modal/AsistenceModal";
import Admin from "./Pages/Admin";

export default function App() {
  const { width, height } = useWindowSize();
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [currentView, setCurrentView] = useState<'home' | 'form'>('home');
  
  // Secret admin route: type or share this hash to access admin
  const SECRET_ADMIN_HASH = '#/__sigma-astral-portal__b2f9a7-91a4';

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isAdmin = route.startsWith(SECRET_ADMIN_HASH);

  // Verificar si hoy es domingo (0 = domingo, 6 = sábado)
  const isSunday = new Date().getDay() === 0;

  const handleContinue = () => {
    setCurrentView('form');
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  // Si es la ruta de administración, muestra el Admin
  if (isAdmin) {
    return (
      <main style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '24px 16px'
      }}>
        <Admin />
      </main>
    );
  }

  // Si currentView es 'form', muestra el formulario
  if (currentView === 'form') {
    return <Form onBack={handleBack} />;
  }

  // Si viewForm es false, muestra la página de bienvenida
  return (
    <div className="flex justify-center flex-col items-center bg-[#dee2e6] w-screen h-screen">
      <Confetti
        width={width}
        height={height}
        numberOfPieces={500}
        recycle={false}
        colors={['#F4D35E', '#28AFB0', '118ab2']}
      />

      <LogoFiladelfia />

      <div className="flex flex-col items-center gap-10 m-2 justify-center item-center">
        <h1 className=" sm:text-[15px] text-blue-950 text-center lg:text-base md:text-2xl">
          ¡Únete a la Juventud de la Iglesia!
        </h1>
        <p className="text-center text-[14px] lg:text-2xl md:text-sm  ">
          ¡Inscríbete hoy y ven a vivir momentos increíbles: fe, risas y nuevos amigos te esperan!
        </p>
      </div>
      <Modal onContinue={handleContinue} />
      {isSunday && <AsistenceModal />}
    </div>
  );
}
