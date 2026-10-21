type Props = {
  /** Delai de confection en jours ouvres */
  productionTime?: number;
  isCustomAvailable?: boolean;
};

/**
 * Le parcours d'une commande en trois etapes.
 *
 * Un visiteur venu d'une publicite ne connait pas la maison : avant de payer
 * un acompte, il veut savoir ce qui se passe apres. Trois etapes concretes
 * rassurent davantage que des pictogrammes generiques (« paiement securise »,
 * « qualite premium ») qu'on retrouve sur n'importe quel site.
 */
export default function HowItWorks({ productionTime = 7, isCustomAvailable = true }: Props) {
  const steps = [
    {
      number: "01",
      title: "Vous commandez",
      text: isCustomAvailable
        ? "Choisissez votre taille, ou laissez-vous guider pour renseigner vos mesures. Un acompte lance la confection."
        : "Choisissez votre taille. Un acompte lance la préparation de votre commande.",
    },
    {
      number: "02",
      title: "Nous confectionnons",
      text: `Votre pièce est coupée et cousue à la main dans notre atelier de Dakar, sous ${productionTime} jours ouvrés.`,
    },
    {
      number: "03",
      title: "Vous recevez",
      text: "Livraison à Dakar sous 48h, solde réglé à la réception. Retouches incluses si l'ajustement n'est pas parfait.",
    },
  ];

  return (
    <section aria-labelledby="how-it-works" className="border-t border-[#E8E4E0] pt-8 lg:pt-10">
      <h2 id="how-it-works" className="text-[11px] tracking-[0.3em] uppercase text-[#999] mb-6">
        Comment ça marche
      </h2>
      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.number} className="flex gap-5">
            <span className="font-luxury text-2xl text-[#C9A45C] leading-none pt-0.5 tabular-nums">
              {step.number}
            </span>
            <div>
              <h3 className="font-sans text-[15px] font-medium text-[#0D0D0D] mb-1">{step.title}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
