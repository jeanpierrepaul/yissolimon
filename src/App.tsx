import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AvisParent } from './pages/avis';
import { ChoixGarderie } from './pages/choixgarderie';
import { Cadre, Chargement } from './components/ui';
import { SessionProvider, useSession } from './lib/session';
import { AccueilAccompagnateur, Bibliotheque, Compte, Connexion, Coordination, FichePage, GarderieAccompagnee } from './pages/autres';
import { Annuaire } from './pages/services';
import { Activites } from './pages/activites';
import { AccueilResponsable, ActionPage, EvaluationPage, PlanPage, ResultatsPage, SuiviResponsable } from './pages/responsable';

function Routeur() {
  const { profil, chargement } = useSession();
  const { pathname } = useLocation();
  // Au rechargement de la page, l'animation reste visible au moins deux secondes.
  const [demarrage, setDemarrage] = useState(true);
  useEffect(() => { const t = setTimeout(() => setDemarrage(false), 2000); return () => clearTimeout(t); }, []);
  // Le questionnaire des parents est public : pas de connexion demandée.
  if (pathname.startsWith('/avis/')) return <Routes><Route path="/avis/:code" element={<AvisParent />} /></Routes>;
  if (pathname === '/parents') return <Routes><Route path="/parents" element={<ChoixGarderie />} /></Routes>;
  if (chargement || demarrage) return <Chargement />;
  if (!profil) return <Connexion />;
  const accueil = profil.role === 'responsable' ? <AccueilResponsable />
    : profil.role === 'accompagnateur' ? <AccueilAccompagnateur /> : <Coordination />;
  return (
    <Cadre>
      <Routes>
        <Route path="/" element={accueil} />
        <Route path="/bibliotheque" element={<Bibliotheque />} />
        <Route path="/fiche/:id" element={<FichePage />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/services" element={<Annuaire />} />
        <Route path="/activites" element={<Activites />} />
        {profil.role !== 'coordination' && <>
          <Route path="/evaluation/:id/resultats" element={<ResultatsPage />} />
          <Route path="/action/:id" element={<ActionPage />} />
        </>}
        {profil.role === 'responsable' && <>
          <Route path="/evaluation/:id" element={<EvaluationPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/suivi" element={<SuiviResponsable />} />
        </>}
        {profil.role === 'accompagnateur' && <Route path="/garderie/:id" element={<GarderieAccompagnee />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Cadre>
  );
}

export default function App() {
  return <SessionProvider><BrowserRouter><Routeur /></BrowserRouter></SessionProvider>;
}
