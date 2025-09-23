import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Verificação de segurança para ambiente servidor
    if (typeof window === 'undefined') {
      return;
    }

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Verificar na montagem
    checkIsMobile();

    // Tentar usar matchMedia primeiro (mais eficiente)
    if (typeof window.matchMedia !== 'undefined') {
      try {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        
        // Handler para mudanças na media query
        const handleChange = () => {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Usar addEventListener se disponível, senão addListener (fallback para navegadores antigos)
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', handleChange);
          return () => {
            try {
              mql.removeEventListener('change', handleChange);
            } catch (error) {
              console.warn('Erro ao remover listener matchMedia:', error);
            }
          };
        } else if (typeof mql.addListener === 'function') {
          // Fallback para navegadores mais antigos
          mql.addListener(handleChange);
          return () => {
            try {
              mql.removeListener(handleChange);
            } catch (error) {
              console.warn('Erro ao remover listener matchMedia (legacy):', error);
            }
          };
        }
      } catch (error) {
        console.warn('Erro com matchMedia, usando fallback de resize:', error);
        // Continua para o fallback de resize
      }
    }

    // Fallback: usar resize listener se matchMedia não estiver disponível ou falhar
    const resizeHandler = () => {
      checkIsMobile();
    };

    window.addEventListener('resize', resizeHandler);
    
    return () => {
      try {
        window.removeEventListener('resize', resizeHandler);
      } catch (error) {
        console.warn('Erro ao remover resize listener:', error);
      }
    };
  }, []);

  // Retornar false se ainda não foi determinado (hidratação SSR)
  return isMobile ?? false;
}