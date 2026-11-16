import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Conditions d'utilisation · IAChain" };

export default function ConditionsPage() {
  return (
    <LegalPage
      titre="Conditions d'utilisation"
      miseAJour="16 novembre 2026"
      intro="Ces conditions encadrent l'utilisation d'IAChain, plateforme d'agents IA pour les processus métier éditée par SOCYTAY SARL (Maroc). En utilisant le service, vous les acceptez."
      autre={{ href: "/confidentialite", label: "Politique de confidentialité" }}
      sections={[
        {
          titre: "1. Objet",
          paragraphes: [
            "IAChain met à disposition des organisations des agents et des workflows d'intelligence artificielle destinés à préparer, analyser et automatiser des tâches professionnelles.",
          ],
        },
        {
          titre: "2. Accès et compte",
          paragraphes: [
            "L'accès est réservé aux professionnels. L'ouverture de l'accès à la plateforme est validée par l'équipe IAChain, après confirmation du règlement de l'abonnement. Vous êtes responsable de la confidentialité de vos identifiants et des actions réalisées avec votre compte.",
          ],
        },
        {
          titre: "3. Utilisation acceptable",
          paragraphes: [
            "Vous vous engagez à ne pas utiliser le service pour des activités illégales, pour porter atteinte aux droits de tiers, pour tenter d'accéder aux données d'autres organisations ou pour perturber le fonctionnement de la plateforme.",
          ],
        },
        {
          titre: "4. Contenus générés par l'IA",
          paragraphes: [
            "Les résultats produits par les agents sont des aides à la décision et peuvent comporter des erreurs. Vous restez responsable de leur vérification avant toute utilisation, envoi ou décision. IAChain prévoit des étapes d'approbation humaine, qu'il vous appartient d'utiliser.",
          ],
        },
        {
          titre: "5. Vos données et propriété",
          paragraphes: [
            "Vous conservez la propriété des contenus que vous confiez à IAChain. Vous nous autorisez à les traiter uniquement pour fournir le service, conformément à notre politique de confidentialité. IAChain et ses composants restent la propriété de SOCYTAY SARL.",
          ],
        },
        {
          titre: "6. Disponibilité",
          paragraphes: [
            "Nous faisons des efforts raisonnables pour maintenir le service disponible, sans garantie d'absence d'interruption. Des maintenances ou des incidents chez nos prestataires peuvent affecter temporairement l'accès.",
          ],
        },
        {
          titre: "7. Responsabilité",
          paragraphes: [
            "Dans les limites permises par la loi, SOCYTAY SARL n'est pas responsable des dommages indirects, ni des conséquences de l'utilisation de résultats générés par l'IA sans vérification. Sa responsabilité est limitée au montant des sommes payées au titre de l'abonnement sur la période concernée.",
          ],
        },
        {
          titre: "8. Résiliation",
          paragraphes: [
            "Vous pouvez cesser d'utiliser le service à tout moment. Nous pouvons suspendre ou résilier un accès en cas de non-paiement ou de manquement à ces conditions.",
          ],
        },
        {
          titre: "9. Droit applicable",
          paragraphes: [
            "Ces conditions sont soumises au droit marocain. En cas de litige, les tribunaux marocains compétents seront seuls compétents.",
          ],
        },
        {
          titre: "10. Contact",
          paragraphes: ["Pour toute question : contact@socytay.ma."],
        },
      ]}
    />
  );
}