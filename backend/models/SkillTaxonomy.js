/**
 * Skill Taxonomy Model
 * Master list of all valid skills. Admin-managed.
 * Students pick from this list only — no free-text skills.
 */

const mongoose = require('mongoose');

const skillTaxonomySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['programming', 'cloud', 'ai_ml', 'cybersecurity', 'design', 'soft_skills', 'domain', 'devops'],
        message: '{VALUE} is not a valid category'
      }
    },
    is_trending: {
      type: Boolean,
      default: false
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Indexes
// (name already has unique:true in schema)
skillTaxonomySchema.index({ category: 1 });
skillTaxonomySchema.index({ is_active: 1 });

module.exports = mongoose.model('SkillTaxonomy', skillTaxonomySchema);
