import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { LogoFiladelfia } from "./assets/SVG/LogoFila";
import { Modal } from "./components/Modal/Modal";
import { Form } from "./components/Form/Form";
import { AsistenceModal } from "./components/Modal/AsistenceModal";
import Admin from "./Pages/Admin";
import { getActividadesSemana, type Actividad } from "./services/Api";

export default function App() {
  const { width, height } = useWindowSize();
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [currentView, setCurrentView] = useState<'home' | 'form'>('home');
  const [formInitialData, setFormInitialData] = useState<Record<string, string> | undefined>(undefined)
  const [actividadActual, setActividadActual] = useState<Actividad | null>(null);
  
  // Secret admin route: type or share this hash to access admin
  const SECRET_ADMIN_HASH = '#/__sigma-astral-portal__c3d4e2-4f10';

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    // Obtener la actividad del día actual
    const cargarActividadActual = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const actividades = await getActividadesSemana({ fecha: hoy });
        if (actividades.length > 0) {
          setActividadActual(actividades[0]);
        }
      } catch (error) {
        console.error("Error al cargar actividad actual:", error);
      }
    };

    cargarActividadActual();
  }, []);

  const isAdmin = route.startsWith(SECRET_ADMIN_HASH);

  // Verificar si hoy es domingo. Puede forzarse en build/runtime con VITE_IS_SUNDAY.
  // Se soporta también la variable antigua IS_SUNDAY como fallback si existe.
  // Si ninguna está presente, se usa la fecha local (0 = Sunday).
  const _envIsSunday = (import.meta.env.VITE_IS_SUNDAY ?? import.meta.env.IS_SUNDAY) as string | undefined;
  
  const isSunday = typeof _envIsSunday === 'string' && _envIsSunday.trim() !== ''
    ? _envIsSunday.trim().toLowerCase() === 'true'
    : new Date().getDay() === 0;

  const handleContinue = () => {
    setCurrentView('form');
  };

  const handleRegisterRedirect = (initial: Record<string, string>) => {
    setFormInitialData(initial)
    setCurrentView('form')
  }

  const handleBack = () => {
    setCurrentView('home');
    setFormInitialData(undefined)
  };

  // Si es la ruta de administración, muestra el Admin
  if (isAdmin) {
    return (
      <main style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#f3f4f6',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <Admin />
      </main>
    );
  }

  // Si currentView es 'form', muestra el formulario
  if (currentView === 'form') {
    return <Form onBack={handleBack} initialData={formInitialData} />;
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
      {isSunday && actividadActual && <AsistenceModal onRegisterRedirect={handleRegisterRedirect} actividadId={actividadActual?._id || ''} />}
    </div>
  );
}
