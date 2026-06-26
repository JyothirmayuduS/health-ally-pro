import { DoctorScreenHeader as Header } from "./DoctorScreenHeader";

type Props = {
  subtitle: string;
  title?: string;
  showSearch?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
};

/** @deprecated Prefer DoctorScreenHeader */
export function DoctorPageHero(props: Props) {
  return <Header {...props} />;
}

export { Header as DoctorScreenHeader };
