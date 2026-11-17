import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Mentions légales · IAChain" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      titre="Mentions légales"
      miseAJour="17 novembre 2026"
      intro="Conformément à la réglementation applicable, voici les informations relatives à l'éditeur du site et de la plateforme IAChain."
      autre={{ href: "/confidentialite", label: "Politique de confidentialité" }}
      sections={[
        {
          titre: "1. Éditeur",
          paragraphes: [
            "IAChain est éditée par SOCYTAY, société à responsabilité limitée de droit marocain, au capital de 100 000 MAD.",
            "Siège social : 105 boulevard Rahal Meskini, 7e étage, appartement 71, Casablanca, Maroc.",
            "Registre de commerce de Casablanca n° 730519. Identifiant fiscal : 72077176. ICE : 003939641000087.",
            "Contact : contact@socytay.ma.",
          ],
        },
        {
          titre: "2. Directeur de la publication",
          paragraphes: ["Le directeur de la publication est Chakib Nahass."],
        },
        {
          titre: "3. Hébergement et prestataires techniques",
          paragraphes: [
            "L'application est hébergée par Vercel Inc. (États-Unis). La base de données est fournie par Neon et l'authentification par Clerk. La liste des prestataires et le détail des traitements figurent dans la politique de confidentialité.",
          ],
        },
        {
          titre: "4. Propriété intellectuelle",
          paragraphes: [
            "Sauf mention contraire, les éléments du site et de la plateforme (textes, interface, logiciels, marque et logo) sont la propriété de SOCYTAY. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite. Les contenus que vous saisissez dans IAChain restent les vôtres.",
          ],
        },
        {
          titre: "5. Données personnelles",
          paragraphes: [
            "Le traitement des données personnelles est décrit dans la politique de confidentialité. Pour exercer vos droits, écrivez à contact@socytay.ma.",
          ],
        },
        {
          titre: "6. Droit applicable",
          paragraphes: [
            "Les présentes mentions sont soumises au droit marocain. En cas de litige, et sous réserve des dispositions impératives applicables, les tribunaux de Casablanca sont compétents.",
          ],
        },
      ]}
    />
  );
}