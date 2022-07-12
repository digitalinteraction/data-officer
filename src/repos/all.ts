import { getCoffeeClubRepo } from "./coffee_club.ts";
import { getOpenlabRepo } from "./openlab_ncl_ac_uk.ts";

export function getAllRepos() {
  return [
    getOpenlabRepo(),
    getCoffeeClubRepo(),
  ];
}
