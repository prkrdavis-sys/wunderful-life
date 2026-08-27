import type { MutableRefObject } from "react";
import type { SiteEditorSection } from "@/components/admin/AdminViewProvider";
import { AboutEditor, GalleryEditor } from "@/components/admin/site-editor/AboutSections";
import { BrandsEditor } from "@/components/admin/site-editor/BrandsSection";
import { ServicesEditor, TestimonialsEditor } from "@/components/admin/site-editor/CopySections";
import {
  CtaEditor,
  HeroEditor,
  ProfileEditor,
  StatsEditor,
} from "@/components/admin/site-editor/IdentitySections";
import { PhotographyEditor } from "@/components/admin/site-editor/PhotographySection";
import type {
  SiteEditorFieldsProps,
  SiteEditorVideoProps,
  SiteEditorWorkProps,
} from "@/components/admin/site-editor/types";
import { UgcEditor } from "@/components/admin/site-editor/UgcSection";
import { WorkEditor } from "@/components/admin/site-editor/WorkSection";

export function SiteEditorSectionView({
  section,
  fields,
  video,
  work,
  photoCardRefs,
}: {
  section: SiteEditorSection;
  fields: SiteEditorFieldsProps;
  video: SiteEditorVideoProps;
  work: SiteEditorWorkProps;
  photoCardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  switch (section) {
    case "profile":
      return <ProfileEditor form={fields.form} setForm={fields.setForm} />;
    case "hero":
      return <HeroEditor {...fields} {...video} />;
    case "about":
      return <AboutEditor {...fields} />;
    case "stats":
      return <StatsEditor form={fields.form} setForm={fields.setForm} />;
    case "work":
      return (
        <WorkEditor
          form={fields.form}
          setForm={fields.setForm}
          {...work}
        />
      );
    case "services":
      return <ServicesEditor form={fields.form} setForm={fields.setForm} />;
    case "photography":
      return <PhotographyEditor {...fields} photoCardRefs={photoCardRefs} />;
    case "brands":
      return <BrandsEditor {...fields} />;
    case "testimonials":
      return <TestimonialsEditor form={fields.form} setForm={fields.setForm} />;
    case "photos":
      return <GalleryEditor {...fields} />;
    case "ugc":
      return <UgcEditor form={fields.form} setForm={fields.setForm} />;
    case "cta":
      return <CtaEditor {...fields} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
