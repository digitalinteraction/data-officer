import { getCoffeeClubRepo } from "./coffee_club.ts";
import { getOpenlabRepo } from "./openlab_ncl_ac_uk.ts";

/** The active repositories that app will use */
export function getAllRepos() {
  return [
    getOpenlabRepo(),
    getCoffeeClubRepo(),
  ];
}
