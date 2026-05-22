import MultiStepForm from "../../components/assessments/Multistepform";
import { FilePlus } from "lucide-react";

export default function AssessmentPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto relative z-10">
      <div className="flex flex-col gap-2 mb-8 mt-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
            <FilePlus className="w-8 h-8 text-[#0284c7]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">New AI Assessment</h1>
        </div>
        <p className="text-slate-500 ml-1 mt-1 font-medium">
          Enter patient clinical data and upload MRI scans to initiate a new Prostate AI detection analysis.
        </p>
      </div>
      
      <MultiStepForm />
    </div>
  );
}