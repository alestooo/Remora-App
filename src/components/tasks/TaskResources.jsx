import { FileText } from "lucide-react";
export default function TaskResources({ driveFolderUrl, resources = [] }) {
  return <>
    {driveFolderUrl && <><h3>Carpeta principal</h3><div className="docs-list"><a href={driveFolderUrl} target="_blank" rel="noreferrer"><FileText size={18} />Abrir carpeta de Drive</a></div></>}
    {resources.length > 0 && <><h3>Recursos</h3><div className="docs-list">{resources.map((resource, index) => <a href={resource.url} target="_blank" rel="noreferrer" key={resource.name + index}><FileText size={18} />{resource.type} · {resource.name}</a>)}</div></>}
  </>;
}
