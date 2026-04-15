import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";

/* -------------------- Types -------------------- */
export interface DetailedMouldFormValues {
  id: string;
  mouldCode: string;
  mouldName: string;
  partNumber: string;
  currentStatus: string;
  totalShotsCompleted: number;
  shotLifeLimit: number;
  currentLocation: string;

  partName: string;
  model: string;
  mouldNo: string;
  mouldIdNo: string;
  thmsId: string;
  assetNumber: string;
  customerName: string;
  mouldCommissioningDate: string;
  mouldSteelCoreCavity: string;
  mouldWeightCore: string;
  mouldWeightCavity: string;
  mouldSize: string;
  numberOfCavities: string;
  toolMaker: string;
  jobIdNo: string;
  mouldClampingTonnage: string;
  plasticRawMaterial: string;
  drawing2dAvailable: "Yes" | "No";
  cad3dAvailable: "Yes" | "No";
  cadDataLocation: string;
  cadDataRevision: string;
  regulatoryMarkingApplicable: "Yes" | "No";
  regulatoryMarkingSpecAvailable: "Yes" | "No";
  regulatoryMarkingStorageLocation?: string;
  regulatoryMarkingType: "Insert" | "Engraved" | "NA";
  numberOfGates: number;
  gateType: "Normal" | "Sequential";
  hotRunnerId: string;
  hotRunnerMake: string;
  hotRunnerZones: number;
  ejectorSystemType: string;
  coolingLineLpmCore: number;
  coolingLineLpmCavity: number;

  supplierName: string;
  dateRecieved: string;
  pmThreshold: { pmScheduleDate: string; pmScheduleTime: number };
  compatibleMachines: string[];
  mouldReadinessCheeckStatus: string;
  documents: string[];
  createdBy: string;
  remarks: string;
  lastModifiedDate: string;
}

/* -------------------- Default Values -------------------- */
export const DEFAULT_MOULD_FORM_VALUES: DetailedMouldFormValues = {
  id: "",
  mouldCode: "",
  mouldName: "",
  partNumber: "",
  supplierName: "",
  dateRecieved: "",
  currentStatus: "OK",
  totalShotsCompleted: 0,
  shotLifeLimit: 0,
  pmThreshold: { pmScheduleDate: "", pmScheduleTime: 0 },
  currentLocation: "",
  compatibleMachines: [],
  mouldReadinessCheeckStatus: "",
  documents: [],
  createdBy: "",
  remarks: "",
  lastModifiedDate: "",

  partName: "",
  model: "",
  mouldNo: "",
  mouldIdNo: "",
  thmsId: "",
  assetNumber: "",
  customerName: "",
  mouldCommissioningDate: "",
  mouldSteelCoreCavity: "",
  mouldWeightCore: "",
  mouldWeightCavity: "",
  mouldSize: "",
  numberOfCavities: "",
  toolMaker: "",
  jobIdNo: "",
  mouldClampingTonnage: "",
  plasticRawMaterial: "",
  drawing2dAvailable: "No",
  cad3dAvailable: "No",
  cadDataLocation: "",
  cadDataRevision: "",
  regulatoryMarkingApplicable: "No",
  regulatoryMarkingSpecAvailable: "No",
  regulatoryMarkingStorageLocation: "",
  regulatoryMarkingType: "NA",
  numberOfGates: 0,
  gateType: "Normal",
  hotRunnerId: "",
  hotRunnerMake: "",
  hotRunnerZones: 0,
  ejectorSystemType: "",
  coolingLineLpmCore: 0,
  coolingLineLpmCavity: 0,
};

/* -------------------- Props -------------------- */
interface MouldFormProps {
  initialValues?: DetailedMouldFormValues | null;
  onSubmit: (data: DetailedMouldFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
  editing?: boolean;
}

/* -------------------- Component -------------------- */
export const MouldForm: React.FC<MouldFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Register Mould",
  editing = false,
}) => {
  const form = useForm<DetailedMouldFormValues>({
    defaultValues: initialValues ?? DEFAULT_MOULD_FORM_VALUES,
  });

  // Reset when the parent provides different initialValues (e.g., when editing an item)
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    } else {
      form.reset(DEFAULT_MOULD_FORM_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white">
        {/* SECTION 1: Basic Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="mouldCode" render={({ field }) => (
              <FormItem><FormLabel>Mould Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldName" render={({ field }) => (
              <FormItem><FormLabel>Mould Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="partNumber" rules={{ required: "Required" }} render={({ field }) => (
              <FormItem><FormLabel>Part No. *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="partName" rules={{ required: "Required" }} render={({ field }) => (
              <FormItem><FormLabel>Part Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="model" rules={{ required: "Required" }} render={({ field }) => (
              <FormItem><FormLabel>Model *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="mouldNo" rules={{ required: "Required" }} render={({ field }) => (
              <FormItem><FormLabel>Mould No. *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="mouldIdNo" rules={{ required: "Required" }} render={({ field }) => (
              <FormItem><FormLabel>Mould ID No. *</FormLabel><FormControl><Input {...field} disabled={editing} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="thmsId" render={({ field }) => (
              <FormItem><FormLabel>THMS ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="assetNumber" render={({ field }) => (
              <FormItem><FormLabel>Asset Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldCommissioningDate" render={({ field }) => (
              <FormItem><FormLabel>Commissioning Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="supplierName" render={({ field }) => (
              <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="dateRecieved" render={({ field }) => (
              <FormItem><FormLabel>Date Received</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 2: Mould Specifications */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Mould Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="mouldSteelCoreCavity" render={({ field }) => (
              <FormItem><FormLabel>Mould Steel (Core/Cavity)</FormLabel><FormControl><Input {...field} placeholder="e.g., NIMAX" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldWeightCore" render={({ field }) => (
              <FormItem><FormLabel>Mould Wt. Core (Ton)</FormLabel><FormControl><Input {...field} placeholder="e.g., 5.25" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldWeightCavity" render={({ field }) => (
              <FormItem><FormLabel>Mould Wt. Cavity (Ton)</FormLabel><FormControl><Input {...field} placeholder="e.g., 3.75" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldSize" render={({ field }) => (
              <FormItem><FormLabel>Mould Size (LxBxH)</FormLabel><FormControl><Input {...field} placeholder="e.g., 1240x1720x1171" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="numberOfCavities" render={({ field }) => (
              <FormItem><FormLabel>Number of Cavities</FormLabel><FormControl><Input {...field} placeholder="e.g., 1+1" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="mouldClampingTonnage" render={({ field }) => (
              <FormItem><FormLabel>Clamping Tonnage</FormLabel><FormControl><Input {...field} placeholder="e.g., 910 T" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="plasticRawMaterial" render={({ field }) => (
              <FormItem><FormLabel>Plastic Raw Material</FormLabel><FormControl><Input {...field} placeholder="e.g., PP 20% TF" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="toolMaker" render={({ field }) => (
              <FormItem><FormLabel>Tool Maker</FormLabel><FormControl><Input {...field} placeholder="e.g., STEC" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="jobIdNo" render={({ field }) => (
              <FormItem><FormLabel>Job ID No.</FormLabel><FormControl><Input {...field} placeholder="e.g., 361" /></FormControl></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 3: Documentation & CAD Data */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Documentation & CAD Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="drawing2dAvailable" render={({ field }) => (
              <FormItem><FormLabel>2D Drawing Available</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="cad3dAvailable" render={({ field }) => (
              <FormItem><FormLabel>3D CAD Available</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="cadDataLocation" render={({ field }) => (
              <FormItem><FormLabel>CAD Data Location</FormLabel><FormControl><Input {...field} placeholder="e.g., STEC" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="cadDataRevision" render={({ field }) => (
              <FormItem><FormLabel>CAD Data Revision</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 4: Regulatory Marking */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Regulatory Marking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="regulatoryMarkingApplicable" render={({ field }) => (
              <FormItem><FormLabel>Marking Applicable</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="regulatoryMarkingSpecAvailable" render={({ field }) => (
              <FormItem><FormLabel>Spec Available</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="regulatoryMarkingStorageLocation" render={({ field }) => (
              <FormItem><FormLabel>Storage Location</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="regulatoryMarkingType" render={({ field }) => (
              <FormItem><FormLabel>Marking Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Insert">Insert</SelectItem>
                  <SelectItem value="Engraved">Engraved</SelectItem>
                  <SelectItem value="NA">NA</SelectItem>
                </SelectContent>
              </Select></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 5: Gate & Hot Runner */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Gate & Hot Runner System</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="numberOfGates" render={({ field }) => (
              <FormItem><FormLabel>Number of Gates</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="gateType" render={({ field }) => (
              <FormItem><FormLabel>Gate Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Normal">Normal</SelectItem><SelectItem value="Sequential">Sequential</SelectItem></SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="hotRunnerId" render={({ field }) => (
              <FormItem><FormLabel>Hot Runner ID</FormLabel><FormControl><Input {...field} placeholder="e.g., S2014051586" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="hotRunnerMake" render={({ field }) => (
              <FormItem><FormLabel>Hot Runner Make</FormLabel><FormControl><Input {...field} placeholder="e.g., YUDO" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="hotRunnerZones" render={({ field }) => (
              <FormItem><FormLabel>Hot Runner Zones</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="ejectorSystemType" render={({ field }) => (
              <FormItem><FormLabel>Ejector System Type</FormLabel><FormControl><Input {...field} placeholder="e.g., Knock out Rod" /></FormControl></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 6: Cooling System */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Cooling System</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="coolingLineLpmCore" render={({ field }) => (
              <FormItem><FormLabel>Cooling LPM Core (@ 5 bar)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} placeholder="e.g., 7" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="coolingLineLpmCavity" render={({ field }) => (
              <FormItem><FormLabel>Cooling LPM Cavity (@ 5 bar)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} placeholder="e.g., 8" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="currentLocation" render={({ field }) => (
              <FormItem><FormLabel>Mould Location</FormLabel><FormControl><Input {...field} placeholder="e.g., ,003" /></FormControl></FormItem>
            )} />
          </div>
        </div>

        {/* SECTION 7: Additional Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="currentStatus" render={({ field }) => (
              <FormItem><FormLabel>Current Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="totalShotsCompleted" render={({ field }) => (
              <FormItem><FormLabel>Total Shots Completed</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="shotLifeLimit" render={({ field }) => (
              <FormItem><FormLabel>Shot Life Limit</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="pmThreshold.pmScheduleDate" render={({ field }) => (
              <FormItem><FormLabel>PM Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="pmThreshold.pmScheduleTime" render={({ field }) => (
              <FormItem><FormLabel>PM Threshold</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.currentTarget.value))} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="createdBy" render={({ field }) => (
              <FormItem><FormLabel>Created By</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="compatibleMachines" render={({ field }) => (
              <FormItem className="md:col-span-2"><FormLabel>Compatible Machines (comma separated)</FormLabel><FormControl><Input value={field.value?.join(",") || ""} onChange={e => field.onChange(e.currentTarget.value.split(",").map((s) => s.trim()))} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="mouldReadinessCheeckStatus" render={({ field }) => (
              <FormItem><FormLabel>Readiness</FormLabel><FormControl><Input {...field} placeholder="e.g., Ready / Not Ready" /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="lastModifiedDate" render={({ field }) => (
              <FormItem><FormLabel>Last Modified</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="documents" render={({ field }) => (
              <FormItem><FormLabel>Documents (comma separated)</FormLabel><FormControl><Input value={field.value?.join(",") || ""} onChange={e => field.onChange(e.currentTarget.value.split(",").map((s) => s.trim()))} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem className="md:col-span-3"><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>
            )} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </DialogClose>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};