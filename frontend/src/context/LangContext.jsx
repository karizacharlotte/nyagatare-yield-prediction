import { createContext, useContext, useState } from 'react'

const STRINGS = {
  en: {
    nav_home: 'Home',
    nav_predict: 'Predict',
    nav_about: 'About',
    hero_title: 'Predict Your Harvest',
    hero_sub: 'AI-powered yield forecasting for bean and rice farmers in Nyagatare District',
    hero_cta: 'Start Predicting',
    hero_stat1_val: '216',
    hero_stat1_lbl: 'Field Trials',
    hero_stat2_val: '0.67',
    hero_stat2_lbl: 'Model R²',
    hero_stat3_val: '2',
    hero_stat3_lbl: 'Crop Models',
    form_title: 'Yield Prediction',
    form_crop: 'Crop Type',
    form_crop_bean: 'Bean — Ibishyimbo',
    form_crop_rice: 'Rice — Umuceri',
    form_fertiliser: 'Fertiliser Applied',
    form_npk_note: 'Toggle which nutrients were applied',
    form_sector: 'Sector',
    form_prev_crop: 'Previous Crop',
    form_month: 'Planting Month',
    form_days: 'Growing Days',
    form_rain: 'Total Rainfall (mm)',
    form_temp: 'Mean Temperature (°C)',
    form_submit: 'Predict Yield',
    form_loading: 'Calculating…',
    result_title: 'Your Predicted Yield',
    result_range: 'Likely Range',
    result_unit: 't/ha',
    result_confidence: 'Confidence',
    result_rmse: 'RMSE',
    result_r2: 'Model R²',
    result_note: 'Based on RAB field trial data — Nyagatare District',
    result_high: 'Above average yield expected 🎉',
    result_avg: 'Average yield expected',
    result_low: 'Below average — consider adjusting inputs',
    about_title: 'About This Project',
    about_body: 'This system uses machine learning (Random Forest & Gradient Boosting) trained on RAB field trial data from Nyagatare District to predict crop yields based on fertiliser treatment, location, climate, and growing season.',
    footer_copy: '© 2024 Charlotte Kariza · ALU BSc Software Engineering Capstone',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  },
  rw: {
    nav_home: 'Ahabanza',
    nav_predict: 'Teganya',
    nav_about: 'Inyandiko',
    hero_title: 'Teganya Umusaruro Wawe',
    hero_sub: 'Sisitemu ya AI iteganya umusaruro w\'ibishyimbo n\'umuceri mu Murenge wa Nyagatare',
    hero_cta: 'Tangira Guteganya',
    hero_stat1_val: '216',
    hero_stat1_lbl: 'Ibigeragezo by\'Ubutaka',
    hero_stat2_val: '0.67',
    hero_stat2_lbl: 'Imikorere ya Modeli',
    hero_stat3_val: '2',
    hero_stat3_lbl: 'Modeli z\'Ibihingwa',
    form_title: 'Guteganya Umusaruro',
    form_crop: 'Ubwoko bw\'Igihingwa',
    form_crop_bean: 'Ibishyimbo — Bean',
    form_crop_rice: 'Umuceri — Rice',
    form_fertiliser: 'Ifumbire Yakoreshejwe',
    form_npk_note: 'Kanda kugirango werekane ibyakoreshejwe',
    form_sector: 'Umurenge',
    form_prev_crop: 'Ibihingwa Byabanjirije',
    form_month: 'Ukwezi kw\'Ibiba',
    form_days: 'Iminsi yo Gukura',
    form_rain: 'Imvura Yose (mm)',
    form_temp: 'Ubushyuhe Buringanye (°C)',
    form_submit: 'Teganya Umusaruro',
    form_loading: 'Turagena…',
    result_title: 'Umusaruro Wagenewe',
    result_range: 'Intera y\'Ibisubizo',
    result_unit: 't/ha',
    result_confidence: 'Ikizere',
    result_rmse: 'RMSE',
    result_r2: 'Imikorere ya Modeli R²',
    result_note: 'Bishingiye ku makuru ya RAB — Nyagatare',
    result_high: 'Umusaruro mwinshi uritezweho 🎉',
    result_avg: 'Umusaruro wo hagati uritezweho',
    result_low: 'Munsi y\'umusaruro — reba uko wahindura',
    about_title: 'Inyandiko y\'Umushinga',
    about_body: 'Iyi sisitemu ikoresha uburyo bwa machine learning (Random Forest na Gradient Boosting) yigijwe ku makuru ya RAB avuye muri Nyagatare kugirango iteganya umusaruro.',
    footer_copy: '© 2024 Charlotte Kariza · ALU BSc Software Engineering — Umushinga wa Capstone',
    months: ['Mutarama','Gashyantare','Werurwe','Mata','Gicurasi','Kamena','Nyakanga','Kanama','Nzeli','Ukwakira','Ugushyingo','Ukuboza'],
  },
}

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')
  const t = (key) => STRINGS[lang][key] ?? key
  return (
    <LangContext.Provider value={{ lang, setLang, t, STRINGS }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
