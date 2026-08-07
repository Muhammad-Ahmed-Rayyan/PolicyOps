import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  months_as_customer: 328,
  age: 48,
  policy_state: "OH",
  policy_csl: "250/500",
  policy_deductable: 1000,
  policy_annual_premium: 1406.91,
  umbrella_limit: 0,
  insured_sex: "MALE",
  insured_education_level: "MD",
  insured_occupation: "craft-repair",
  insured_hobbies: "sleeping",
  insured_relationship: "husband",
  capital_gains: 53300,
  capital_loss: 0,
  incident_type: "Single Vehicle Collision",
  collision_type: "Side Collision",
  incident_severity: "Major Damage",
  authorities_contacted: "Police",
  incident_state: "SC",
  incident_city: "Columbus",
  incident_hour_of_the_day: 5,
  number_of_vehicles_involved: 1,
  property_damage: "YES",
  bodily_injuries: 1,
  witnesses: 2,
  police_report_available: "YES",
  total_claim_amount: 71610,
  injury_claim: 6510,
  property_claim: 13020,
  vehicle_claim: 52080,
  auto_make: "Saab",
  auto_year: 2004,
  days_policy_to_incident: 5432,
};

const SELECT_OPTIONS = {
  policy_csl: ["100/300", "250/500", "500/1000"],
  insured_sex: ["MALE", "FEMALE"],
  insured_education_level: ["High School", "Associate", "College", "JD", "MD", "PhD", "Masters"],
  insured_relationship: ["husband", "wife", "own-child", "unmarried", "not-in-family", "other-relative"],
  incident_type: ["Single Vehicle Collision", "Multi-vehicle Collision", "Vehicle Theft", "Parked Car"],
  collision_type: ["Side Collision", "Rear Collision", "Front Collision", "Unknown"],
  incident_severity: ["Trivial Damage", "Minor Damage", "Major Damage", "Total Loss"],
  authorities_contacted: ["Police", "Fire", "Ambulance", "Other", "None"],
  property_damage: ["YES", "NO", "Unknown"],
  police_report_available: ["YES", "NO", "Unknown"],
};

const NUMERIC_FIELDS = new Set([
  "months_as_customer", "age", "policy_deductable", "policy_annual_premium",
  "umbrella_limit", "capital_gains", "capital_loss", "incident_hour_of_the_day",
  "number_of_vehicles_involved", "bodily_injuries", "witnesses", "total_claim_amount",
  "injury_claim", "property_claim", "vehicle_claim", "auto_year", "days_policy_to_incident",
]);

function Field({ label, name, value, onChange }) {
  const isSelect = name in SELECT_OPTIONS;
  const isNumeric = NUMERIC_FIELDS.has(name);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {isSelect ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SELECT_OPTIONS[name].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={isNumeric ? "number" : "text"}
          step={isNumeric ? "any" : undefined}
          name={name}
          value={value}
          onChange={onChange}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function PredictionForm({ onResult }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = NUMERIC_FIELDS.has(name);
    setForm((prev) => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      "capital-gains": form.capital_gains,
      "capital-loss": form.capital_loss,
    };
    delete payload.capital_gains;
    delete payload.capital_loss;

    try {
      const res = await axios.post(`${API_URL}/predict`, payload);
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name) => (
    <Field key={name} label={label} name={name} value={form[name]} onChange={handleChange} />
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Policy Info">
        {field("Months as Customer", "months_as_customer")}
        {field("Policy State", "policy_state")}
        {field("Policy CSL", "policy_csl")}
        {field("Policy Deductible", "policy_deductable")}
        {field("Annual Premium", "policy_annual_premium")}
        {field("Umbrella Limit", "umbrella_limit")}
        {field("Days: Policy to Incident", "days_policy_to_incident")}
      </Section>

      <Section title="Insured Info">
        {field("Age", "age")}
        {field("Sex", "insured_sex")}
        {field("Education Level", "insured_education_level")}
        {field("Occupation", "insured_occupation")}
        {field("Hobbies", "insured_hobbies")}
        {field("Relationship", "insured_relationship")}
        {field("Capital Gains", "capital_gains")}
        {field("Capital Loss", "capital_loss")}
      </Section>

      <Section title="Incident Details">
        {field("Incident Type", "incident_type")}
        {field("Collision Type", "collision_type")}
        {field("Severity", "incident_severity")}
        {field("Authorities Contacted", "authorities_contacted")}
        {field("Incident State", "incident_state")}
        {field("Incident City", "incident_city")}
        {field("Hour of Day", "incident_hour_of_the_day")}
        {field("Vehicles Involved", "number_of_vehicles_involved")}
        {field("Property Damage", "property_damage")}
        {field("Bodily Injuries", "bodily_injuries")}
        {field("Witnesses", "witnesses")}
        {field("Police Report Available", "police_report_available")}
      </Section>

      <Section title="Claim Amounts">
        {field("Total Claim Amount", "total_claim_amount")}
        {field("Injury Claim", "injury_claim")}
        {field("Property Claim", "property_claim")}
        {field("Vehicle Claim", "vehicle_claim")}
      </Section>

      <Section title="Vehicle Info">
        {field("Auto Make", "auto_make")}
        {field("Auto Year", "auto_year")}
      </Section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-md transition"
      >
        {loading ? "Predicting..." : "Predict Fraud Risk"}
      </button>
    </form>
  );
}