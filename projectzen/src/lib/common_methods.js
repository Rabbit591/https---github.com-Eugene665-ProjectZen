import { supabase } from "./supabase";

export async function authenticateUser(login_or_email, password) {
  try {
    const { data, error } = await supabase.rpc("authenticate_user", {
      login_or_email: login_or_email,
      p_password: password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function signup(
  email,
  password,
  username,
  isCompanyOrUser,
  about = ""
) {
  try {
    if (!isCompanyOrUser) {
      const { error } = await supabase.rpc("register_user", {
        p_email: email,
        p_password: password,
        p_username: username,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("register_company", {
        p_username: username,
        p_password: password,
        p_email: email,
        p_about: about,
      });
      if (error) throw error;
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function addProject(projectDataJson, companyId) {
  try {
    const { data, error } = await supabase.rpc("add_project", {
      p_project_data: projectDataJson,
      p_company_id: companyId,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function fetchProjects() {
  const { data, error } = await supabase.rpc("fetch_projects");

  if (error) throw error;
  return data;
}

export async function uploadImageToSupabase(file, fileName) {
  const uniqueFileName = `${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from("images")
    .upload(`images/${uniqueFileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });
  console.log(data);
  if (error) {
    console.error("Error uploading image:", error);
    return null;
  }
  const { data: publicData, error: urlError } = await supabase.storage
    .from("images")
    .getPublicUrl(`images/${uniqueFileName}`);
  if (urlError) {
    console.error("Error getting public URL:", urlError);
    return null;
  }
  return publicData.publicUrl;
}

export async function deleteImageFromSupabase(imageUrl) {
  const urlParts = imageUrl.split("/");
  const bucketName = "images";
  const bucketIndex = urlParts.indexOf(bucketName);
  if (bucketIndex === -1) {
    console.error("Bucket name not found in URL");
    return false;
  }

  const filePath = urlParts.slice(bucketIndex + 1).join("/");

  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error("Error deleting image:", error);
    return false;
  }

  console.log("Image deleted successfully:", data);
  return true;
}
